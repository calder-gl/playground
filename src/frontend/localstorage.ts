import { currentState, onChange } from './state';
import { SerializableState } from './serializable_models/state';
import { range, throttle } from 'lodash';
import { List } from 'immutable';
import { ObjLoader } from './loader';
import { saveAndRun } from './client';
import { editor } from './editor';

const saveAsBtn = <HTMLButtonElement>document.getElementById('saveAs');
const deleteBtn = <HTMLButtonElement>document.getElementById('deleteFile');
const menu = <HTMLSelectElement>document.getElementById('edit');
const DEFAULT = 'sample';
const NEW = '___new';

/* View Updater Functions */

// Default sample names
const names = [
    'cathedral',
    'model_tree',
    'mondrian',
    'snake',
    'sphere_tree',
    'treehouse'
];

export const updateEditMenu = () => {
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

    // Add all sample filenames
    names.forEach((name) => {
        // Don't add if already in localStorage.
        if (name in localStorage) return;

        const option = document.createElement('option');
        option.value = name;
        option.innerText = name;
        menu.appendChild(option);
    });

    const newOption = document.createElement('option');
    newOption.value = NEW;
    newOption.innerText = 'New...';
    menu.appendChild(newOption);
};

/* Event Listeners */

menu.addEventListener('change', () => {
    let currentDocument: string = menu.value;

    // Only fetch the source if it a corresponding document has not been made for it.
    if (names.indexOf(currentDocument) !== -1 && !(currentDocument in localStorage)) {
        currentState.setDocumentTitle(currentDocument);
        currentState.clearState();
        currentState.setState({ costFnParams: List([]) });

        ObjLoader.loadSample(currentDocument)
            .then((source) => {
                editor.getSession().setValue(source);
                saveAndRun();
            });

        currentState.persist();
        return;
    }

    if (currentDocument === NEW) {
        currentState.setDocumentTitle(prompt('Filename:') || DEFAULT);
    } else {
        currentState.setDocumentTitle(currentDocument);
    }

    currentState.retrieve();
});

saveAsBtn.addEventListener('click', () => {
    const name = prompt('New filename:');

    if (name) {
        // Save state for current model.
        currentState.persist();

        // Create new model and persist the state.
        currentState.setDocumentTitle(name);
        currentState.persist();

        updateEditMenu();
    }
});

deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this document?')) {
        currentState.remove();
        currentState.setDocumentTitle(DEFAULT);
        currentState.retrieve();
    }
});

['source', 'costFnParams', 'maxDepth'].forEach((key: keyof SerializableState) => {
    onChange(key, throttle(
        () => currentState.persist(),
        100,
        { trailing: true }
    ));
});
