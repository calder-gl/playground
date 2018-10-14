import * as calder from 'calder-gl';
import { List } from 'immutable';

export type State = {
    generator?: calder.Generator;
    source?: string;
    model?: calder.Model;
    costFnParams?: List<calder.GuidingCurve>;
    costFn?: calder.CostFn;
    vectorField?: Float32Array;
    guidingCurves?: List<calder.GuidingCurveInfo>;
    selectedCurve?: number | null;
    generatorTask?: calder.GeneratorTask;
    pencilLine?: {x: number; y: number}[];
};

export const state: State = {};

const listeners: {[key in keyof State]: (() => void)[]} = {};

export const setState = (newState: Partial<State>) => {
    for (const key in newState) {
        state[key] = newState[key];
        if (listeners[key]) {
            listeners[key].forEach((callback) => callback());
        }
    }
};

export const onChange = (key: keyof State, callback: () => void) => {
    if (!listeners[key]) {
        listeners[key] = [];
    }

    (<(() => void)[]>listeners[key]).push(callback);
};
