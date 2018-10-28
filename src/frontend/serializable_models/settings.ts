import { Serializable } from './serializable';

enum Keybinding {
    Normal = 'normal',
    Vim = 'vim',
    Emacs = 'emacs',
}

type SerializableSettings = {
    keybinding: string
};

export type BakedSettings = {
    keybinding?: Keybinding;
};

export class Settings implements Serializable<BakedSettings> {
    public keybinding?: Keybinding;

    constructor() {
        this.clearState();
    }

    serialize(): string {
        const serializedObject: SerializableSettings = {
            keybinding: this.keybinding || "normal"
        };
        return JSON.stringify(serializedObject);
    }

    deserialize(serialized: string) {
        const serializedObject = <SerializableSettings>JSON.parse(serialized);
        this.keybinding = <Keybinding>serializedObject.keybinding;
    }

    asBakedType(): BakedSettings {
        return {
            keybinding: this.keybinding
        }
    }

    setState(_newState: Partial<BakedSettings>) {
    }

    clearState() {
        this.keybinding = undefined;
    }
}
