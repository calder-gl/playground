import * as calder from 'calder-gl';

// tslint:disable-next-line:import-name
import Bezier = require('bezier-js');

import { setState, state } from './state';

const scale: [number, number, number] = [0, 0, 100];
const guidingVectors = [
    {
        bezier: new Bezier([
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 1 },
            { x: 2, y: 2, z: 1 }
        ]),
        distanceMultiplier: scale,
        alignmentMultiplier: 500,
        alignmentOffset: 0.7
    },
    {
        bezier: new Bezier([
            { x: 0, y: 1, z: 0 },
            { x: 0.5, y: 2, z: 1 },
            { x: 0, y: 3, z: 1 },
            { x: 0, y: 3, z: 2 }
        ]),
        distanceMultiplier: scale,
        alignmentMultiplier: 500,
        alignmentOffset: 0.6
    }
]

export const addCostFn = () => {
    const costFn = calder.CostFunction.guidingVectors(guidingVectors);

    setState({ costFn });
};

export const addCostFunctionViz = () => {
    if (!state.costFn) {
        return;
    }

    const vectorField = state.costFn.generateVectorField();
    const guidingCurve = state.costFn.generateGuidingCurve();

    setState({ vectorField, guidingCurve });
};
