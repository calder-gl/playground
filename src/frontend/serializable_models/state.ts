import * as calder from 'calder-gl';
import { List } from 'immutable';
import { defer } from 'lodash';

import { clearUndoRedo, listeners } from '../state';
import { Persistable } from './persistable';
import { Serializable } from './serializable';

const codeElement = <HTMLScriptElement>document.getElementById('code');
export const defaultSource = codeElement.innerText;

// tslint:disable-next-line:import-name
import Bezier = require('bezier-js');

// SerializableGuidingCurve is the type representation of a guiding curve to be
// JSON serialized.
type SerializableGuidingCurve = {
    bezier: calder.coord[];
    distanceMultiplier: calder.DistanceMultiplier;
    alignmentMultiplier: number;
    alignmentOffset: number;
};

// SerializableState is the type representation of State to be JSON serialized.
export type SerializableState = {
    source?: string;
    costFnParams?: SerializableGuidingCurve[];
    maxDepth?: number;
};

export const DEFAULT_STATE_FILENAME = 'sample';

// StateObject is the type representation of Settings used internally.
export type StateObject = {
    generator?: calder.Generator;
    source?: string;
    model?: calder.Model;
    costFnParams?: List<calder.GuidingCurve>;
    costFn?: calder.CostFn;
    vectorField?: Float32Array;
    guidingCurves?: List<calder.GuidingCurveInfo>;
    selectedCurve?: number | null;
    generating?: boolean;
    pencilLine?: { x: number; y: number }[];
    maxDepth?: number;
};

/**
 * State refers to the state of the WebGL Calder program compiled and executed
 * in the editor.
 *
 * @class State
 */
export class State extends Persistable<StateObject> implements Serializable<StateObject> {
    generator?: calder.Generator;
    source?: string;
    model?: calder.Model;
    costFnParams?: List<calder.GuidingCurve>;
    costFn?: calder.CostFn;
    vectorField?: Float32Array;
    guidingCurves?: List<calder.GuidingCurveInfo>;
    selectedCurve?: number | null;
    generating?: boolean;
    pencilLine?: { x: number; y: number }[];
    maxDepth?: number;

    freshStateCallbacks: (() => void)[] = [];

    /**
     * constructor creates a new Serializable State object.
     *
     * @class State
     * @constructor
     */
    constructor() {
        super(DEFAULT_STATE_FILENAME);
        this.clearState()

        // Once all other setup has run, populate the state.
        defer(() => this.retrieve());
    }

    /**
     * serialize serializes the current serializedObject into a JSON compliant
     * string to be stored in localstorage.
     *
     * @class State
     * @method serialize
     * @interface Serializable
     * @return {string}
     */
    serialize(): string {
        const serializedObject: SerializableState = {};
        serializedObject.source = this.source;

        serializedObject.costFnParams = this.costFnParams &&
            this.costFnParams.toJS().map((curve) => {
                return {
                    distanceMultiplier: curve.distanceMultiplier,
                    alignmentMultiplier: curve.alignmentMultiplier,
                    alignmentOffset: curve.alignmentOffset,
                    bezier: curve.bezier.points
                };
            });

        serializedObject.maxDepth = this.maxDepth;

        return JSON.stringify(serializedObject);
    }

    /**
     * deserialize takes a serialized representation of the object State as a
     * JSON string and updates the properties of the object with the values
     * represented in the string.
     *
     * @class State
     * @method deserialize
     * @interface Serializable
     * @param {string} serialized The serialized JSON object.
     */
    deserialize(serialized: string) {
        // Set all values to undefined.
        this.clearState();

        // Deserialize the stored JSON object.
        const serializedObject = <SerializableState>JSON.parse(serialized);

        // Clear the undo and redo stacks for the editor.
        clearUndoRedo();

        // Clear the current properties of the State object.
        this.clearState()

        const source = serializedObject.source || defaultSource;

        const costFnParams = serializedObject.costFnParams &&
            List(serializedObject.costFnParams.map((curve: SerializableGuidingCurve) => {
                return {
                    distanceMultiplier: curve.distanceMultiplier,
                    alignmentMultiplier: curve.alignmentMultiplier,
                    alignmentOffset: curve.alignmentOffset,
                    bezier: new Bezier(curve.bezier)
                };
            }));

        const maxDepth = serializedObject.maxDepth;

        // Update the state of the object.
        this.setState({ source, costFnParams, maxDepth });

        // Update other state with fresh state callbacks (since we only
        // serialize the `source` and `costFnParams`.
        this.freshStateCallbacks.forEach((callback) => callback());
    }

    /**
     * getUnderlyingObject returns a representation of the State object as a TypeScript
     * type.
     *
     * @class State
     * @method getUnderlyingObject
     * @interface Serializable
     * @return {StateObject}
     */
    getUnderlyingObject(): StateObject {
        return this;
    }

    /**
     * setState updates the state for the State object with a partial
     * implementation of State.
     *
     * @class State
     * @method setState
     * @interface Serializable
     * @param {Partial<StateObject>} newState The new state for the object.
     */
    setState(newState: Partial<StateObject>) {
        // Don't set the state if we don't have new state to overwrite.
        if (newState == undefined) return;

        for (const key in newState) {
            this[key] = newState[key];

            if (listeners[key]) {
                listeners[key].forEach((callback) => callback());
            }
        }
    }

    /**
     * onFreshState pushes the callbacks contained in the scope of the function
     * to the callbacks for the state object.
     *
     * @class State
     * @method onFreshState
     * @interface Serializable
     * @param {() => void} callback The callback to be pushed.
     */
    onFreshState(callback: () => void) {
        this.freshStateCallbacks.push(callback);
    }

    /**
     * clearState clears all of the property values for the State object.
     *
     * @class State
     * @method clearState
     * @interface Serializable
     */
    clearState() {
        this.generator = undefined;
        this.source = undefined;
        this.model = undefined;
        this.costFnParams = undefined;
        this.costFn = undefined;
        this.vectorField = undefined;
        this.guidingCurves = undefined;
        this.selectedCurve = undefined;
        this.generating = undefined;
        this.pencilLine = undefined;
        this.maxDepth = undefined;
    }
}
