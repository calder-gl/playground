import { Serializable } from './serializable';
import { Persistable } from './persistable';

// Keybinding refers to the keybindings for the editor.
enum Keybinding {
    Normal = 'normal',
    Emacs = 'emacs',
    Vim = 'vim',
}

// stringToKeybinding converts a string representation to a Keybinding enum value.
export function stringToKeybinding(s: string): Keybinding {
    switch (s) {
        case 'emacs':
            return Keybinding.Emacs;
        case 'vim':
            return Keybinding.Vim;
        default:
            return Keybinding.Normal;
    }
}

// Theme is the value for the editor's theme.
enum Theme {
    Default = 'default',
    SolarizedDark = 'solarized_dark',
}

// stringToTheme converts a string representation to a Theme enum value.
export function stringToTheme(s: string): Theme {
    switch (s) {
        case 'solarized_dark':
            return Theme.SolarizedDark;
        default:
            return Theme.Default;
    }
}

// SerializableSettings is the type representation of Settings to be JSON
// serialized.
type SerializableSettings = {
    keybinding: string;
    theme: string;
};

// BakedSettings is the type representation of Settings used internally.
export type BakedSettings = {
    keybinding?: Keybinding;
    theme?: Theme;
};

/**
 * Settings refers to the user-defined configuration settings for the Calder
 * editor.
 *
 * @class Settings
 */
export class Settings extends Persistable<BakedSettings> implements Serializable<BakedSettings> {
    keybinding?: Keybinding;
    theme?: Theme;

    /**
     * constructor creates a new Serializable Settings object.
     *
     * @class Settings
     * @constructor
     */
    constructor() {
        super('settings');
        this.clearState();
    }

    /**
     * serialize serializes the current serializedObject into a JSON compliant
     * string to be stored in localstorage.
     *
     * @class Settings
     * @method serialize
     * @interface Serializable
     * @return {string}
     */
    serialize(): string {
        const serializedObject: SerializableSettings = {
            keybinding: this.keybinding || 'normal',
            theme: this.theme || 'default'
        };
        return JSON.stringify(serializedObject);
    }

    /**
     * deserialize takes a serialized representation of the object Settings as a
     * JSON string and updates the properties of the object with the values
     * represented in the string.
     *
     * @class Settings
     * @method deserialize
     * @interface Serializable
     * @param {string} serialized The serialized JSON object.
     */
    deserialize(serialized: string) {
        const serializedObject = <SerializableSettings>JSON.parse(serialized);
        this.keybinding = <Keybinding>serializedObject.keybinding;
    }

    /**
     * asBakedType returns a representation of the Settings object as a
     * BakedSettings type.
     *
     * @class Settings
     * @method asBakedType
     * @interface Serializable
     * @return {BakedSettings}
     */
    asBakedType(): BakedSettings {
        return this;
    }

    /**
     * setState updates the values for the Settings object with a partial
     * implementation of Settings.
     *
     * @class Settings
     * @method setState
     * @interface Serializable
     * @param {Partial<BakedSettings>} newState The new state for the object.
     */
    setState(newState: Partial<BakedSettings>) {
        if (newState == undefined) return;

        for (const key in newState) {
            this[key] = newState[key];
        }
    }

    /**
     * clearState clears all of the property values for the Settings object.
     *
     * @class Settings
     * @method clearState
     * @interface Serializable
     */
    clearState() {
        this.keybinding = undefined;
        this.theme = undefined;
    }
}
