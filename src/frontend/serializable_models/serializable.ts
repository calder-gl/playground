/**
 * Serializable is an interface for frontend serializable_models to be stored
 * with localstorage.
 */
export interface Serializable<T> {
    // Takes the object and serialize it to a JSON string representation.
    serialize(): string;

    // Takes the a JSON string representation and updates the properties of the
    // object instance.
    deserialize(serialized: string);

    // Returns a representation of the object as a TypeScript type T.
    getUnderlyingObject(): T;

    // Sets the state of the object with a partial implementation of the
    // TypeScript type T.
    setState(newState: Partial<T>);

    // Pushes callbacks contained in scope of function to class which implements
    // the interface.
    onFreshState(callback: () => void);

    // Cleans the object's state by clearing all the properties of the object.
    clearState();
}
