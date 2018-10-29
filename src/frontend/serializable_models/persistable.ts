import { Serializable } from './serializable';

/**
 * Persistable is an interface for objects to be stored in local storage.
 *
 * @class Persistable
 */
export abstract class Persistable<T> implements Serializable<T> {
    /**
     * persist persists the serialized object representation to local storage.
     *
     * @class Persistable
     * @method persist
     * @param {string} document The document to persist the JSON string to.
     */
    persist(document: string) {
        localStorage.setItem(document, this.serialize());
    }

    /**
     * Retrieves an JSON serialized object from local storage.
     *
     * @class Persistable
     * @method retrieve
     * @param {string} document The document to retrieve the JSON string from.
     */
    retrieve(document: string) {
        const savedState = localStorage.getItem(document) || '{}';
        this.deserialize(savedState);
    }

    // Takes the object and serialize it to a JSON string representation.
    abstract serialize(): string;

    // Takes the a JSON string representation and updates the properties of the
    // object instance.
    abstract deserialize(serialized: string);

    // Returns a representation of the object as a TypeScript type T.
    abstract asBakedType(): T;

    // Sets the state of the object with a partial implementation of the
    // TypeScript type T.
    abstract setState(newState: Partial<T>);

    // Cleans the object's state by clearing all the properties of the object.
    abstract clearState();
}
