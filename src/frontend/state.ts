import * as calder from 'calder-gl';

export type State = {
    generator?: calder.Generator;
    source?: string;
    model?: calder.Model;
    costFnParams?: calder.GuidingCurve[];
    costFn?: calder.CostFn;
    vectorField?: Float32Array;
    guidingCurves?: calder.GuidingCurveInfo[];
    generatorTask?: calder.GeneratorTask;
};

export const state: State = {};

export const setState = (newState: Partial<State>) => {
    for (const key in newState) {
        state[key] = newState[key];
    }
};
