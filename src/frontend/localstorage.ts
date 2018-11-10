import { settings, state, onChange } from './state';
import { defaultSource } from './editor';
import { range, throttle } from 'lodash';
import { stringToKeybinding, stringToTheme } from './serializable_models/settings';
import { editor } from './editor';

const saveSettingsBtn = <HTMLButtonElement>document.getElementById('saveSettings');
const saveAsBtn = <HTMLButtonElement>document.getElementById('saveAs');
const deleteBtn = <HTMLButtonElement>document.getElementById('deleteFile');
const menu = <HTMLSelectElement>document.getElementById('edit');
const menuBlacklist: Set<string> = new Set<string>(['settings']);
const DEFAULT = 'sample';
const NEW = '___new';

let currentDocument: string;

/* Loaders */

const loadSettings = () => settings.retrieve();

const loadStateForDocument = (document: string) => {
    state.setDocumentTitle(document);
    state.retrieve();
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

const saveState = () => state.persist();

export const initializeLocalStorage = () => {
    if (!localStorage.getItem(DEFAULT)) {
        localStorage.setItem(DEFAULT, JSON.stringify({ source: defaultSource }));
    }

    if (!currentDocument) {
        currentDocument = DEFAULT;
        loadStateForDocument(currentDocument);
    }

    loadSettings();
    updateSettingsInView();
    updateEditMenu();
};

/* Event Listeners */

menu.addEventListener('change', () => {
    currentDocument = menu.value;

    if (currentDocument === NEW) {
        currentDocument = prompt('Filename:') || DEFAULT;
    }

    loadStateForDocument(currentDocument);
});

saveSettingsBtn.addEventListener('click', () => {
    const editorElement = <HTMLInputElement>document.querySelector('#editor input:checked');
    const editorValue = editorElement.value;

    settings.setState({
        keybinding: stringToKeybinding(editorValue),
        theme: stringToTheme('default')
    });
    settings.persist();
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
