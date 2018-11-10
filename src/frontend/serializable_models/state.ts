import * as calder from 'calder-gl';
import { List } from 'immutable';
import { Serializable } from './serializable';
import { clearUndoRedo, freshStateCallbacks, listeners } from '../state';

// tslint:disable-next-line:import-name
import Bezier = require('bezier-js');
import { Persistable } from './persistable';

// SerializableGuidingCurve is the type representation of a guiding curve to be
// JSON serialized.
type SerializableGuidingCurve = {
    bezier: calder.coord[];
    distanceMultiplier: calder.DistanceMultiplier;
    alignmentMultiplier: number;
    alignmentOffset: number;
};

// SerializableState is the type representation of State to be JSON serialized.
type SerializableState = {
    source?: string;
    costFnParams?: SerializableGuidingCurve[];
};

export const DEFAULT_STATE_FILENAME = 'sample';

// BakedState is the type representation of Settings used internally.
export type BakedState = {
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
};

/**
 * State refers to the state of the WebGL Calder program compiled and executed
 * in the editor.
 *
 * @class State
 */
export class State extends Persistable<BakedState> implements Serializable<BakedState> {
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

    /**
     * constructor creates a new Serializable State object.
     *
     * @class State
     * @constructor
     */
    constructor() {
        super(DEFAULT_STATE_FILENAME);
        this.clearState()
    }

    /**
     * serialize serializes the current serializedObject into a JSON compliant
     * string to be stored in localstorage.
     *
     * @class State
     * @method serialize
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

        return JSON.stringify(serializedObject);
    }

    /**
     * deserialize takes a serialized representation of the object State as a
     * JSON string and updates the properties of the object with the values
     * represented in the string.
     *
     * @class State
     * @method deserialize
     * @param {string} serialized The serialized JSON object.
     */
    deserialize(serialized: string) {
        // Deserialize the stored JSON object.
        const serializedObject = <SerializableState>JSON.parse(serialized);

        // Clear the undo and redo stacks for the editor.
        clearUndoRedo();

        // Clear the current properties of the State object.
        this.clearState()

        this.source = serializedObject.source;
        this.costFnParams = serializedObject.costFnParams &&
            List(serializedObject.costFnParams.map((curve: SerializableGuidingCurve) => {
                return {
                    distanceMultiplier: curve.distanceMultiplier,
                    alignmentMultiplier: curve.alignmentMultiplier,
                    alignmentOffset: curve.alignmentOffset,
                    bezier: new Bezier(curve.bezier)
                };
            }));

        // Update other state with fresh state callbacks (since we only
        // serialize the `source` and `costFnParams`.
        freshStateCallbacks.forEach((callback) => callback());
    }

    /**
     * asBakedType returns a representation of the State object as a TypeScript
     * type.
     *
     * @class State
     * @method asBakedType
     * @return {BakedState}
     */
    asBakedType(): BakedState {
        return this;
    }

    /**
     * setState updates the state for the State object with a partial
     * implementation of State.
     *
     * @class State
     * @method setState
     * @param {Partial<BakedState>} newState The new state for the object.
     */
    setState(newState: Partial<BakedState>) {
        if (newState == undefined) return;

        for (const key in newState) {
            this[key] = newState[key];

            if (listeners[key]) {
                listeners[key].forEach((callback) => callback());
            }
        }
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
    }
}
