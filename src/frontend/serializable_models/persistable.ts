import { Serializable } from './serializable';

/**
 * Persistable is an interface for objects to be stored in local storage.
 *
 * @class Persistable
 */
export abstract class Persistable<T> implements Serializable<T> {
    documentTitle: string;

    /**
     * constructor creates a new Persistable concretion object.
     *
     * @class State
     * @constructor
     * @param {string} title The key associated with the localstorage object
     *   persisted.
     */
    constructor(title?: string) {
        this.documentTitle = title || '';
    }

    /**
     * persist persists the serialized object representation to local storage.
     *
     * @class Persistable
     * @method persist
     */
    persist() {
        localStorage.setItem(this.getDocumentTitle(), this.serialize());
    }

    /**
     * retrieve retrieves an JSON serialized object from local storage.
     *
     * @class Persistable
     * @method retrieve
     */
    retrieve() {
        const savedState = localStorage.getItem(this.getDocumentTitle()) || '{}';
        this.deserialize(savedState);
    }

    /**
     * remove deletes the document with this.documentTitle from local storage.
     *
     * @class Persistable
     * @method remove
     */
    remove() {
        localStorage.removeItem(this.getDocumentTitle());
    }

    /**
     * empty checks if the serialized object has not yet been persisted.
     *
     * @class Persistable
     * @method empty
     * @returns {boolean}
     */
    empty(): boolean {
        return !localStorage.getItem(this.getDocumentTitle());
    }

    // Updates the document title associated with the persisted model.
    setDocumentTitle(title: string) { this.documentTitle = title; }

    // The document title associated with the persisted model.
    getDocumentTitle() { return this.documentTitle; }

    // Takes the object and serialize it to a JSON string representation.
    abstract serialize(): string;

    // Takes the a JSON string representation and updates the properties of the
    // object instance.
    abstract deserialize(serialized: string);

    // Returns a representation of the object as a TypeScript type T.
    abstract getUnderlyingObject(): T;

    // Sets the state of the object with a partial implementation of the
    // TypeScript type T.
    abstract setState(newState: Partial<T>);

    // Pushes callbacks contained in scope of function to class which implements
    // the interface.
    abstract onFreshState(callback: () => void);

    // Cleans the object's state by clearing all the properties of the object.
    abstract clearState();
}
