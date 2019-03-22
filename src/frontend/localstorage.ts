import { currentState, onChange } from './state';
import { SerializableState } from './serializable_models/state';
import { defaultSource } from './editor';
import { range, throttle } from 'lodash';

const saveAsBtn = <HTMLButtonElement>document.getElementById('saveAs');
const deleteBtn = <HTMLButtonElement>document.getElementById('deleteFile');
const menu = <HTMLSelectElement>document.getElementById('edit');
const DEFAULT = 'sample';
const NEW = '___new';

/* Persisters */

const maybeInitializeState = () => {
    // Set the state source with default source if it's empty.
    if (!currentState.empty()) return;
    currentState.setState({ source: defaultSource });
    currentState.persist()
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

        if (currentState.getDocumentTitle() === key) {
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
    if (currentState.getDocumentTitle() === '') {
        currentState.setDocumentTitle(DEFAULT);
        maybeInitializeState();
        currentState.deserialize(<string>localStorage.getItem(DEFAULT));
    }

    updateEditMenu();
};

/* Event Listeners */

menu.addEventListener('change', () => {
    let currentDocument = menu.value;

    if (currentDocument === NEW) {
        currentState.setDocumentTitle(prompt('Filename:') || DEFAULT);
        maybeInitializeState();
    } else {
        currentState.setDocumentTitle(currentDocument);
    }

    currentState.retrieve();
});

saveAsBtn.addEventListener('click', () => {
    const name = prompt('New filename:');

    if (name) {
        currentState.persist();
        currentState.setDocumentTitle(name);
        updateEditMenu();
    }
});

deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this document?')) {
        currentState.remove();
        currentState.setDocumentTitle(DEFAULT);
        maybeInitializeState();
        currentState.deserialize(<string>localStorage.getItem(DEFAULT));
    }
});

['source', 'costFnParams', 'maxDepth'].forEach((key: keyof SerializableState) => {
    onChange(key, throttle(
        () => currentState.persist(),
        100,
        { trailing: true }
    ));
});
