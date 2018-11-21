import { settings, state, onChange } from './state';
import { defaultSource } from './editor';
import { range, throttle } from 'lodash';
import { stringToKeybinding, stringToTheme } from './serializable_models/settings';
import { editor } from './editor';
import { DEFAULT_STATE_FILENAME } from './serializable_models/state';

const saveSettingsBtn = <HTMLButtonElement>document.getElementById('saveSettings');
const saveAsBtn = <HTMLButtonElement>document.getElementById('saveAs');
const deleteBtn = <HTMLButtonElement>document.getElementById('deleteFile');
const menu = <HTMLSelectElement>document.getElementById('edit');
const menuBlacklist: Set<string> = new Set<string>(['settings']);
const NEW = '___new';

let currentDocument: string;

/* Persisters */

const saveState    = () => state.persist();
const saveSettings = () => settings.persist();

const maybeInitializeState = () => {
    // Set the state source with default source if it's empty.
    if (!state.empty()) return;
    state.setState({ source: defaultSource });
    state.persist()
};

/* Loaders */

const loadState            = () => state.retrieve();
const loadSettings         = () => settings.retrieve();
const loadStateForDocument = () => {
    state.setDocumentTitle(currentDocument);
    loadState();
};

/* View Updaters */

const updateEditMenu = () => {
    // Clear menu
    while (menu.firstChild) {
        menu.removeChild(menu.firstChild);
    }

    // Add all localStorage keys
    range(localStorage.length).forEach((i) => {
        const key = localStorage.key(i);

        if (!key || menuBlacklist.has(key)) {
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

const updateSettingsInView = () => {
    const { keybinding } = settings.asBakedType();
    const keybindingsValue = <string>keybinding || 'normal'

    // Update the editor.
    editor.setKeyboardHandler(`ace/keyboard/${keybindingsValue}`);

    // Update the UI.
    const radioButton = <HTMLInputElement>document.getElementById(keybindingsValue);
    radioButton.checked = true;
};

export const initializeLocalStorage = () => {
    maybeInitializeState();

    // Set the document title to the DEFAULT_STATE_FILENAME title if it's empty.
    if (!currentDocument) {
        currentDocument = DEFAULT_STATE_FILENAME;
    }

    // Retrieve persistable model data from local storage.
    loadState();
    loadState();
    loadSettings();

    // Update the view to reflect the retrieved data.
    updateSettingsInView();
    updateEditMenu();
};

/* Event Listeners */

menu.addEventListener('change', () => {
    currentDocument = menu.value;

    if (currentDocument === NEW) {
        currentDocument = prompt('Filename:') || DEFAULT_STATE_FILENAME;
    }

    loadStateForDocument();
});

saveSettingsBtn.addEventListener('click', () => {
    const editorElement = <HTMLInputElement>document.querySelector('#editor input:checked');
    const editorValue = editorElement.value;

    settings.setState({
        keybinding: stringToKeybinding(editorValue),
        theme: stringToTheme('default')
    });
    saveSettings();
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
        currentDocument = DEFAULT_STATE_FILENAME;
        maybeInitializeState();
        state.deserialize('{}');
    }
});

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
