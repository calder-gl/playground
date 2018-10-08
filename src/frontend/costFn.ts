import * as calder from 'calder-gl';
import { range, throttle } from 'lodash';

// tslint:disable-next-line:import-name
import Bezier = require('bezier-js');

import { onChange, setState, state } from './state';
import { addModel } from './model';

const costControls = <HTMLDivElement>document.getElementById('cost');
const distanceMultiplierControls = range(3)
    .map((i) => <HTMLInputElement>document.getElementById(`distance${i+1}`));
const alignmentOffsetControl = <HTMLInputElement>document.getElementById('alignmentOffset');
const alignmentMultiplierControl = <HTMLInputElement>document.getElementById('alignmentMultiplier');

const scale: [number, number, number] = [0, 0, 100];
const initialCostFnParams = [
    {
        bezier: new Bezier([
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 1 },
            { x: 2, y: 2, z: 1 }
        ]),
        distanceMultiplier: [...scale],
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
        distanceMultiplier: [...scale],
        alignmentMultiplier: 500,
        alignmentOffset: 0.6
    }
]

export const addCostFn = () => {
    let { costFnParams } = state;
    if (!costFnParams) {
        costFnParams = initialCostFnParams;
    }
    const costFn = calder.CostFunction.guidingVectors(costFnParams);

    setState({ costFnParams, costFn });
};

export const addCostFunctionViz = () => {
    const { costFn, costFnParams, guidingCurves: oldGuidingCurves } = state;
    if (!costFn || !costFnParams) {
        return;
    }

    const vectorField = costFn.generateVectorField();
    const guidingCurves = costFn.generateGuidingCurve().map((path: [number, number, number][], index: number) => {
        return {
            path,
            selected: oldGuidingCurves && oldGuidingCurves[index].selected,
            bezier: costFnParams[index].bezier
        };
    });

    setState({ vectorField, guidingCurves });
};

onChange('selectedCurve', () => {
    const { costFnParams, selectedCurve } = state;
    if (!costFnParams) {
        return;
    }

    if (selectedCurve !== null && selectedCurve !== undefined) {
        costControls.classList.remove('hidden');

        distanceMultiplierControls.forEach(
            (control, i) => control.value = costFnParams[selectedCurve].distanceMultiplier[i]);
        alignmentMultiplierControl.value = costFnParams[selectedCurve].alignmentMultiplier;
        alignmentOffsetControl.value = costFnParams[selectedCurve].alignmentOffset;
    } else {
        costControls.classList.add('hidden');
    }
});

const updateCostFnParams = throttle(() => {
    const { costFnParams, selectedCurve } = state;
    if (!costFnParams || selectedCurve === undefined || selectedCurve === null) {
        return;
    }

    // Don't update values if the whole thing has been deleted
    let ok = true;
    distanceMultiplierControls.forEach((control) => ok = ok && control.value !== "");
    ok = ok && alignmentMultiplierControl.value !== "";
    ok = ok && alignmentOffsetControl.value !== "";

    if (!ok) {
        return;
    }

    distanceMultiplierControls.forEach((control, i) => costFnParams[selectedCurve].distanceMultiplier[i] = parseFloat(control.value));
    costFnParams[selectedCurve].alignmentMultiplier = parseFloat(alignmentMultiplierControl.value);
    costFnParams[selectedCurve].alignmentOffset = parseFloat(alignmentOffsetControl.value);

    addCostFn();
    addModel();
}, 100, { trailing: true });

['keyup', 'change'].forEach((eventName) => {
    costControls.addEventListener(eventName, updateCostFnParams);
    distanceMultiplierControls.forEach((control) => control.addEventListener(eventName, updateCostFnParams));
    alignmentOffsetControl.addEventListener(eventName, updateCostFnParams);
    alignmentMultiplierControl.addEventListener(eventName, updateCostFnParams);
});
