// TODO: rename as undo/redo stack or events.ts

// tslint:disable-next-line:import-name
import { StateObject, State } from './serializable_models/state';

export const currentState: State = new State();

const MAX_UNDO_SIZE = 15;
const undoStack: StateObject[] = [];
const redoStack: StateObject[] = [];

export const listeners: { [key in keyof StateObject]: (() => void)[] } = {};
const undoRedoListeners: (() => void)[] = [];

export const commit = () => {
    const currentStateObject: StateObject = currentState.getUnderlyingObject();

    undoStack.push({ ...currentStateObject });

    // Remove oldest item if there are too many
    if (undoStack.length > MAX_UNDO_SIZE) {
        undoStack.shift();
    }

    redoStack.length = 0;
}

export const merge = () => {
    const currentStateObject: StateObject = currentState.getUnderlyingObject();

    if (undoStack.length === 0) {
        undoStack.push({ ...currentStateObject });
    } else {
        undoStack[undoStack.length - 1] = { ...currentStateObject };
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

    redoStack.push(<StateObject>undoStack.pop());
    this.setState(undoStack[undoStack.length - 1]);
    undoRedoListeners.forEach((callback) => callback());
};

const redo = () => {
    if (redoStack.length === 0) {
        return;
    }

    undoStack.push(<StateObject>redoStack.pop());
    this.setState(undoStack[undoStack.length - 1]);
    undoRedoListeners.forEach((callback) => callback());
}

export const onUndoRedo = (callback: () => void) => {
    undoRedoListeners.push(callback);
};

export const onChange = (key: keyof StateObject, callback: () => void) => {
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
