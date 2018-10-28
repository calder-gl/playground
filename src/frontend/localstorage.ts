import { state, onChange } from './state';
import { range, throttle } from 'lodash';

const saveAsBtn = <HTMLButtonElement>document.getElementById('saveAs');
const deleteBtn = <HTMLButtonElement>document.getElementById('deleteFile');
const menu = <HTMLSelectElement>document.getElementById('edit');
const DEFAULT = 'sample';
const NEW = '___new';
let currentDocument = DEFAULT;

menu.addEventListener('change', () => {
    currentDocument = menu.value;

    if (currentDocument === NEW) {
        currentDocument = prompt('Filename:') || DEFAULT;
    }

    const savedState = localStorage.getItem(currentDocument) || '{}';
    state.deserialize(savedState);
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

const saveState = () => localStorage.setItem(currentDocument, state.serialize());


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
        state.deserialize('{}');
    }
});

export const initializeLocalStorage = () => {
    if (!localStorage.getItem(DEFAULT)) {
        localStorage.setItem(DEFAULT, '{}');
    }
    updateEditMenu();
};

onChange('source', throttle(
    saveState,
    100,
    { trailing: true }
));
onChange('costFnParams', throttle(
    saveState,
    100,
    { trailing: true }
));
