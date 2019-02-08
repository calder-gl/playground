import { SerializableState, loadSavedState, serialize, onChange } from './state';
import { defaultSource } from './editor';
import { range, throttle } from 'lodash';

const saveAsBtn = <HTMLButtonElement>document.getElementById('saveAs');
const deleteBtn = <HTMLButtonElement>document.getElementById('deleteFile');
const menu = <HTMLSelectElement>document.getElementById('edit');
const DEFAULT = 'sample';
const NEW = '___new';
let currentDocument: string;

menu.addEventListener('change', () => {
    currentDocument = menu.value;

    if (currentDocument === NEW) {
        currentDocument = prompt('Filename:') || DEFAULT;
        maybeInitializeState();
    }

    const savedState = localStorage.getItem(currentDocument) || '{}';
    loadSavedState(savedState);
});

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

const saveState = () => localStorage.setItem(currentDocument, serialize());

const maybeInitializeState = () => {
    if (localStorage.getItem(currentDocument)) {
        return;
    }

    localStorage.setItem(currentDocument, JSON.stringify({source: defaultSource}));
};


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
        loadSavedState(<string>localStorage.getItem(DEFAULT));
    }
});

export const initializeLocalStorage = () => {
    if (!currentDocument) {
        currentDocument = DEFAULT;
        maybeInitializeState();
        loadSavedState(<string>localStorage.getItem(currentDocument));
    }

    updateEditMenu();
};

['source', 'costFnParams', 'maxDepth'].forEach((key: keyof SerializableState) => {
    onChange(key, throttle(
        saveState,
        100,
        { trailing: true }
    ));
});
