import { currentState, onChange } from './state';
import { SerializableState } from './serializable_models/state';
import { defaultSource } from './editor';
import { range, throttle } from 'lodash';

const saveAsBtn = <HTMLButtonElement>document.getElementById('saveAs');
const deleteBtn = <HTMLButtonElement>document.getElementById('deleteFile');
const menu = <HTMLSelectElement>document.getElementById('edit');
const DEFAULT = 'sample';
const NEW = '___new';
let currentDocument: string;

/* Persisters */

const saveState = () => currentState.persist();

const maybeInitializeState = () => {
    // Set the state source with default source if it's empty.
    if (!currentState.empty()) return;
    currentState.setState({ source: defaultSource });
    currentState.persist()
};

/* Loaders */

const loadState = () => currentState.retrieve();
const loadStateForDocument = () => {
    currentState.setDocumentTitle(currentDocument);
    loadState();
};

/* View Updater Functions */

const updateEditMenu = () => {
    // Clear menu
    while (menu.firstChild) {
        menu.removeChild(menu.firstChild);
    }

    // Add all localStorage keys
    range(localStorage.length).forEach((i) => {
        const key = localStorage.key(i);

        if (!key) {
            return;
        }

        const option = document.createElement('option');
        option.value = key;
        option.innerText = key;

        if (currentDocument === key) {
            option.selected = true;
        }

        menu.appendChild(option);
    });

    const newOption = document.createElement('option');
    newOption.value = NEW;
    newOption.innerText = 'New...';
    menu.appendChild(newOption);
};

export const initializeLocalStorage = () => {
    if (!currentDocument) {
        currentDocument = DEFAULT;
        maybeInitializeState();
        currentState.deserialize(<string>localStorage.getItem(currentDocument));
    }

    updateEditMenu();
};

/* Event Listeners */

menu.addEventListener('change', () => {
    currentDocument = menu.value;

    if (currentDocument === NEW) {
        currentDocument = prompt('Filename:') || DEFAULT;
        maybeInitializeState();
    }

    loadStateForDocument();
});

saveAsBtn.addEventListener('click', () => {
    const name = prompt('New filename:');

    if (name) {
        currentDocument = name;
        saveState();
        updateEditMenu();
    }
});

deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this document?')) {
        localStorage.removeItem(currentDocument);
        currentDocument = DEFAULT;
        maybeInitializeState();
        currentState.deserialize(<string>localStorage.getItem(DEFAULT));
    }
});

['source', 'costFnParams', 'maxDepth'].forEach((key: keyof SerializableState) => {
    onChange(key, throttle(
        saveState,
        100,
        { trailing: true }
    ));
});
