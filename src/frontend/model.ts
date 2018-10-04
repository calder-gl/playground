import * as calder from 'calder-gl';

import { setState, state } from './state';

export const addModel = () => {
    if (state.generatorTask) {
        // If we were in the middle of generating something else, cancel that task
        state.generatorTask.cancel();
    }

    if (state.generator && state.costFn) {
        state.generatorTask = state.generator.generateSOSMC(
            {
                start: 'START',
                sosmcDepth: 100,
                samples: (generation: number) => 80 - generation / 100 * 70,
                heuristicScale: (generation: number) => {
                    if (generation <= 50) {
                        return 0.01 - generation / 50 * 0.01;
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
    }
};
