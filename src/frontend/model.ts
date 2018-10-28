import * as calder from 'calder-gl';

import { merge, onUndoRedo, state } from './state';

let generatorTask: calder.GeneratorTask | null = null;

export const addModel = () => {
    if (generatorTask) {
        // If we were in the middle of generating something else, cancel that task
        generatorTask.cancel();
    }

    if (state.generator && state.costFn) {
        state.setState({ generating: true });

        generatorTask = state.generator.generateSOSMC(
            {
                start: 'START',
                sosmcDepth: 100,
                samples: (generation: number) => 100 - generation / 100 * 85,
                heuristicScale: (generation: number) => {
                    if (generation <= 40) {
                        return 0.013 - generation / 40 * 0.013;
                    } else {
                        return 0;
                    }
                },
                costFn: state.costFn
            },
            1 / 30
        ).then((model: calder.Model) => {
            generatorTask = null;
            state.setState({ model, generating: false })
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
