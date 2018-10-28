import * as calder from 'calder-gl';
import { List } from 'immutable';
import { Serializable } from './serializable';
import { clearUndoRedo, freshStateCallbacks, listeners } from '../state';

// tslint:disable-next-line:import-name
import Bezier = require('bezier-js');

type SerializableGuidingCurve = {
    bezier: calder.coord[];
    distanceMultiplier: calder.DistanceMultiplier;
    alignmentMultiplier: number;
    alignmentOffset: number;
};

type SerializableState = {
    source?: string;
    costFnParams?: SerializableGuidingCurve[];
};

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

export class State implements Serializable<BakedState> {
    public generator?: calder.Generator;
    public source?: string;
    public model?: calder.Model;
    public costFnParams?: List<calder.GuidingCurve>;
    public costFn?: calder.CostFn;
    public vectorField?: Float32Array;
    public guidingCurves?: List<calder.GuidingCurveInfo>;
    public selectedCurve?: number | null;
    public generating?: boolean;
    public pencilLine?: { x: number; y: number }[];

    /**
     * constructor creates a new blank Serializable State object.
     */
    constructor() {
        this.clearState()
    }

    /**
     * serialize serializes the current serializedObject into a JSON compliant
     * string to be stored in localstorage.
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

        // TODO: document what this does.
        freshStateCallbacks.forEach((callback) => callback());
    }

    /**
     * asBakedType returns a representation of the State object as a TypeScript
     * type.
     */
    asBakedType(): BakedState {
        return {
            generator: this.generator,
            source: this.source,
            model: this.model,
            costFnParams: this.costFnParams,
            costFn: this.costFn,
            vectorField: this.vectorField,
            guidingCurves: this.guidingCurves,
            selectedCurve: this.selectedCurve,
            generating: this.generating,
            pencilLine: this.pencilLine
        }
    }

    /**
     * setState updates the state for the State object with a partial
     * implementation of State.
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
     * clearState clears all of the current state values for the State object.
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
