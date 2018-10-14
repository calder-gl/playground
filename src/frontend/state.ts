import * as calder from 'calder-gl';
import { List } from 'immutable';
import { defer } from 'lodash';

// tslint:disable-next-line:import-name
import Bezier = require('bezier-js');

export type State = {
    generator?: calder.Generator;
    source?: string;
    model?: calder.Model;
    costFnParams?: List<calder.GuidingCurve>;
    costFn?: calder.CostFn;
    vectorField?: Float32Array;
    guidingCurves?: List<calder.GuidingCurveInfo>;
    selectedCurve?: number | null;
    generating?: boolean;
    pencilLine?: {x: number; y: number}[];
};

type SerializableGuidingCurve = {
    bezier: calder.coord[];
    distanceMultiplier: calder.DistanceMultiplier;
    alignmentMultiplier: number;
    alignmentOffset: number;
};

export type SerializableState = {
    source?: string;
    costFnParams?: SerializableGuidingCurve[];
};

export const state: State = {};

const MAX_UNDO_SIZE = 15;
const undoStack: State[] = [];
const redoStack: State[] = [];

const listeners: {[key in keyof State]: (() => void)[]} = {};
const undoRedoListeners: (() => void)[] = [];

export const setState = (newState: Partial<State>) => {
    for (const key in newState) {
        state[key] = newState[key];
        if (listeners[key]) {
            listeners[key].forEach((callback) => callback());
        }
    }
};

export const commit = () => {
    undoStack.push({ ...state });

    // Remove oldest item if there are too many
    if (undoStack.length > MAX_UNDO_SIZE) {
        undoStack.shift();
    }

    redoStack.length = 0;
}

export const merge = () => {
    if (undoStack.length === 0) {
        undoStack.push({ ...state });
    } else {
        undoStack[undoStack.length - 1] = { ...state };
    }
}

export const clearUndoRedo = () => {
    undoStack.length = 0;
    redoStack.length = 0;
};

const undo = () => {
    if (undoStack.length === 0) {
        return;
    }

    redoStack.push(<State>undoStack.pop());
    this.setState(undoStack[undoStack.length - 1]);
    undoRedoListeners.forEach((callback) => callback());
};

const redo = () => {
    if (redoStack.length === 0) {
        return;
    }

    undoStack.push(<State>redoStack.pop());
    this.setState(undoStack[undoStack.length - 1]);
    undoRedoListeners.forEach((callback) => callback());
}

export const onUndoRedo = (callback: () => void) => {
    undoRedoListeners.push(callback);
};

export const onChange = (key: keyof State, callback: () => void) => {
    if (!listeners[key]) {
        listeners[key] = [];
    }

    (<(() => void)[]>listeners[key]).push(callback);
};

window.addEventListener('keydown', (event: KeyboardEvent) => {
    // cmd/ctrl-z for undo, cmd/ctrl-y or shift-cmd/ctrl-z for redo
    if (event.code === 'KeyZ' && !event.shiftKey && (event.ctrlKey || event.metaKey)) {
        undo();
        event.stopPropagation();
        event.preventDefault();
    } else if ((event.code === 'KeyY' || (event.code === 'KeyZ' && event.shiftKey)) && (event.ctrlKey || event.metaKey)) {
        redo();
        event.stopPropagation();
        event.preventDefault();
    }
});

// Saving/loading logic

const freshStateCallbacks: (() => void)[] = [];
export const onFreshState = (callback: () => void) => freshStateCallbacks.push(callback);

export const serialize = (): string => {
    const object: SerializableState = {};

    object.source = state.source;

    object.costFnParams = state.costFnParams && state.costFnParams.toJS().map((curve) => {
        return {
            distanceMultiplier: curve.distanceMultiplier,
            alignmentMultiplier: curve.alignmentMultiplier,
            alignmentOffset: curve.alignmentOffset,
            bezier: curve.bezier.points
        };
    });

    return JSON.stringify(object);
};

export const loadSavedState = (serialized: string) => {
    const object = <SerializableState>JSON.parse(serialized);

    clearUndoRedo();

    const freshState: Partial<State> = {}
    for (let key in state) {
        freshState[key] = undefined;
    }

    freshState.source = object.source;

    freshState.costFnParams = object.costFnParams && List(object.costFnParams.map((curve: SerializableGuidingCurve) => {
        return {
            distanceMultiplier: curve.distanceMultiplier,
            alignmentMultiplier: curve.alignmentMultiplier,
            alignmentOffset: curve.alignmentOffset,
            bezier: new Bezier(curve.bezier)
        };
    }));

    setState(freshState);
    freshStateCallbacks.forEach((callback) => callback());
};

// Once all other setup has run, populate the state
defer(() => freshStateCallbacks.forEach((callback) => callback()));
