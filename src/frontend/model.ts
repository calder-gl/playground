import * as calder from 'calder-gl';

import { merge, onChange, onUndoRedo, setState, state } from './state';

let generatorTask: calder.GeneratorTask | null = null;

const maxDepthInput = <HTMLInputElement>document.getElementById('maxDepth');
maxDepthInput.addEventListener('input', () => {
    const maxDepth: number | undefined = parseInt(maxDepthInput.value);

    // Don't save invalid depths to the state (which would trigger generating a model)
    if (maxDepth <= 0) {
        return;
    }

    setState({ maxDepth });
});

const DEFAULT_MAX_DEPTH = 100;
onChange('maxDepth', () => {
    // Use a default value of 100
    const newValue = `${state.maxDepth || DEFAULT_MAX_DEPTH}`;

    // Avoid resetting the input if it already has this value to not disrupt typing
    if (maxDepthInput.value != newValue) {
        maxDepthInput.value = newValue;
    }

    addModel();
});

// Given maxDepth, which is the total number of rounds of SOSMC we need to do since
// each round adds one bone, figure out how many samples we can afford in each round
// to get the same number of total samples.
const getSamplesCurve = (maxDepth: number) => {
    // We want to have a reasonable but not too large number of samples
    // to pick from in the final generation
    const finalSamples = 15;

    // We want to have approximately this many samples over the course of
    // the entire optimization process to achieve a good runtime (this number
    // is the total samples for maxDepth=100, initialSamples=100; runtime is
    // around 200ms)
    const targetArea = 5750;

    // Given the above values and the provided maxDepth, we want to pick a
    // value for initialSamples so that we can transition linearly to
    // finalSamples for each round i of SOSMC, 0 <= i < maxDepth. Effectively,
    // the bigger a maxDepth we pass in, the smaller we have to make initialSamples
    // to accommodate.
    //
    //                |''--..
    //                |      ''--..
    // initialSamples |            ''--..
    //   (unknown)    |   targetArea     | finalSamples
    //                |__________________|
    //                      maxDepth

    // Note that if maxDepth is big enough, initialSamples eventually reaches the same
    // height as finalSamples. We never want initialSamples to be less than finalSamples
    // since it makes most sense for SOSMC to have more samples initially rather than at
    // the end. I call this threshold rectangleThresholdDepth since, at this maxDepth,
    // we get a rectangle instead of a trapezoid:
    //                    ____________________________
    //  initialSamples   |        targetArea          | finalSamples
    // ( = finalSamples) |____________________________|
    //                       rectangleThresholdDepth
    const rectangleThresholdDepth = Math.floor(targetArea / finalSamples);

    // If we get a maxDepth that is above rectangleThresholdDepth, we are forced to use
    // a lower value of finalSamples. In this case, just use a constant number of samples
    // each round such that we still get the same area.
    if (maxDepth > rectangleThresholdDepth) {
        const samplesPerRound = Math.ceil(targetArea / maxDepth);

        return (_: number) => samplesPerRound;
    }

    // Otherwise, calculate the initial number of samples to reach the target area.
    //
    // From the diagram, splitting the trapezoid into a rectangle and triangle:
    // totalArea = finalSamples * maxDepth + (initialSamples - finalSamples) * maxDepth / 2
    //
    // Simplified:
    // totalArea = finalSamples * maxDepth / 2 + initialSamples * maxDepth / 2
    //
    // Rearranged for initialSamples:
    // initialSamples = (totalArea - finalSamples * maxDepth / 2) * (2 / maxDepth)
    //
    // Simplified:
    const initialSamples = Math.floor(2 * targetArea / maxDepth - finalSamples);

    // Return a curve that slopes linearly from initialSamples to finalSamples.
    // We will have 0 <= generation < maxDepth.
    return (generation: number) =>
        initialSamples - (generation / (maxDepth - 1)) * (initialSamples - finalSamples);
}

export const addModel = () => {
    if (generatorTask) {
        // If we were in the middle of generating something else, cancel that task
        generatorTask.cancel();
    }

    if (state.generator && state.costFn) {
        setState({ generating: true });
        const { maxDepth = DEFAULT_MAX_DEPTH } = state;

        // If maxDepth is less than 40, we should still have no heuristic
        // for the final round of generation
        const heuristicCutoff = Math.min(40, maxDepth);

        generatorTask = state.generator.generateSOSMC(
            {
                start: 'START',
                sosmcDepth: maxDepth,
                samples: getSamplesCurve(maxDepth),
                heuristicScale: (generation: number) => {
                    if (generation <= heuristicCutoff) {
                        return 0.013 - generation / heuristicCutoff * 0.013;
                    } else {
                        return 0;
                    }
                },
                costFn: state.costFn
            },
            1 / 30
        )
        .then((model: calder.Model) => {
            generatorTask = null;
            setState({ model, generating: false })
            merge();
        });
    }
};

onUndoRedo(() => {
    // We want to stop whatever we were generating before
    if (generatorTask) {
        generatorTask.cancel();
        generatorTask = null;
    }

    // If the undo/redo state we jumped to was waiting on a generation
    // task when it was committed, restart the task
    if (state.generating) {
        addModel();
    }
});
