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
    generating?: boolean;
    pencilLine?: {x: number; y: number}[];
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
