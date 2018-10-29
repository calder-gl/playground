import { defer } from 'lodash';
import { BakedState, State } from './serializable_models/state'

const MAX_UNDO_SIZE = 15;
const undoStack: BakedState[] = [];
const redoStack: BakedState[] = [];

export const state = new State();
export const listeners: { [key in keyof BakedState]: (() => void)[] } = {};
const undoRedoListeners: (() => void)[] = [];

export const commit = () => {
    undoStack.push({ ...state.asBakedType() });

    // Remove oldest item if there are too many
    if (undoStack.length > MAX_UNDO_SIZE) {
        undoStack.shift();
    }

    redoStack.length = 0;
}

export const merge = () => {
    if (undoStack.length === 0) {
        undoStack.push({ ...state.asBakedType() });
    } else {
        undoStack[undoStack.length - 1] = { ...state.asBakedType() };
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

    redoStack.push(<BakedState>undoStack.pop());
    state.setState(undoStack[undoStack.length - 1]);
    undoRedoListeners.forEach((callback) => callback());
};

const redo = () => {
    if (redoStack.length === 0) {
        return;
    }

    undoStack.push(<BakedState>redoStack.pop());
    state.setState(undoStack[undoStack.length - 1]);
    undoRedoListeners.forEach((callback) => callback());
}

export const onUndoRedo = (callback: () => void) => {
    undoRedoListeners.push(callback);
};

export const onChange = (key: keyof BakedState, callback: () => void) => {
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
export const freshStateCallbacks: (() => void)[] = [];
export const onFreshState = (callback: () => void) => freshStateCallbacks.push(callback);

// Once all other setup has run, populate the state
defer(() => freshStateCallbacks.forEach((callback) => callback()));
