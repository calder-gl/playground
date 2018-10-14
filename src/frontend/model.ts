import * as calder from 'calder-gl';

import { setState, state } from './state';

export const addModel = () => {
    if (state.generatorTask) {
        // If we were in the middle of generating something else, cancel that task
        state.generatorTask.cancel();
    }

    if (state.generator && state.costFn) {
        const generatorTask = state.generator.generateSOSMC(
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
        )
        .then((model: calder.Model) =>
            setState({ model, generatorTask: undefined }));

        setState({ generatorTask });
    }
};
