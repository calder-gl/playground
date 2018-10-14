import * as calder from 'calder-gl';
import { range, throttle } from 'lodash';
import { fitCurve } from 'fit-curve';
import { mat4, vec4, vec3 } from 'gl-matrix';

// tslint:disable-next-line:import-name
import Bezier = require('bezier-js');

import { onChange, setState, state } from './state';
import { addModel } from './model';
import { renderer } from './renderer';

const costControls = <HTMLDivElement>document.getElementById('cost');
const distanceMultiplierControls = range(3)
    .map((i) => <HTMLInputElement>document.getElementById(`distance${i+1}`));
const alignmentOffsetControl = <HTMLInputElement>document.getElementById('alignmentOffset');
const alignmentMultiplierControl = <HTMLInputElement>document.getElementById('alignmentMultiplier');
const deleteBtn = <HTMLButtonElement>document.getElementById('delete');

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
        alignmentMultiplier: 400,
        alignmentOffset: 0.6
    },
    {
        bezier: new Bezier([
            { x: 0, y: 1, z: 0 },
            { x: 0.5, y: 2, z: 1 },
            { x: 0, y: 3, z: 1 },
            { x: 0, y: 3, z: 2 }
        ]),
        distanceMultiplier: [...scale],
        alignmentMultiplier: 400,
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
            selected: oldGuidingCurves && oldGuidingCurves[index] && oldGuidingCurves[index].selected,
            bezier: costFnParams[index].bezier
        };
    });

    setState({ vectorField, guidingCurves });
};

export const addNewCurve = (polyline: {x: number; y: number}[]) => {
    const [ bezier ] = fitCurve(polyline.map((point) => [point.x, point.y]), 100, undefined, true);
    const depth = vec3.distance(renderer.camera.position, renderer.camera.target);

    const transform = mat4.invert(mat4.create(), renderer.camera.getTransform());
    if (!transform) {
        return;
    }

    const scaleFactor = (1 + depth) * Math.cos(Math.PI / 4);

    const bezier3D = bezier.map(([x, y]) => {
        const point = vec4.fromValues(
            scaleFactor * (x / renderer.width - 0.5),
            -scaleFactor * (y / renderer.height - 0.5),
            -depth,
            1
        );
        vec4.transformMat4(point, point, transform);
        return point;
    });

    const lastCurve = state.costFnParams && state.costFnParams[state.costFnParams.length - 1];

    const curve = {
        bezier: new Bezier(bezier3D.map(([x, y, z]) => { return {x, y, z}; })),
        distanceMultiplier: lastCurve ? [...lastCurve.distanceMultiplier] : [...scale],
        alignmentMultiplier: lastCurve ? lastCurve.alignmentMultiplier : 500,
        alignmentOffset: lastCurve ? lastCurve.alignmentOffset : 0.7
    };

    const { costFnParams = [] } = state;
    costFnParams.push(curve);

    setState({ costFnParams });
}

onChange('selectedCurve', () => {
    const { guidingCurves, costFnParams, selectedCurve } = state;
    if (!costFnParams) {
        return;
    }

    if (guidingCurves) {
        guidingCurves.forEach((curve: calder.GuidingCurveInfo, index: number) => {
            curve.selected = index === selectedCurve;
        });

        setState({ guidingCurves });
    }

    if (selectedCurve !== null && selectedCurve !== undefined) {
        costControls.classList.remove('disabled');
        distanceMultiplierControls.forEach((control) => control.disabled = false);
        alignmentMultiplierControl.disabled = false;
        alignmentOffsetControl.disabled = false;
        deleteBtn.disabled = costFnParams.length <= 1;

        distanceMultiplierControls.forEach(
            (control, i) => control.value = costFnParams[selectedCurve].distanceMultiplier[i]);
        alignmentMultiplierControl.value = costFnParams[selectedCurve].alignmentMultiplier;
        alignmentOffsetControl.value = costFnParams[selectedCurve].alignmentOffset;
    } else {
        costControls.classList.add('disabled');
        distanceMultiplierControls.forEach((control) => control.disabled = true);
        alignmentMultiplierControl.disabled = true;
        alignmentOffsetControl.disabled = true;
        deleteBtn.disabled = true;
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

const deleteCurve = () => {
    const { guidingCurves, costFnParams, selectedCurve } = state;
    if (!guidingCurves || !costFnParams || selectedCurve === undefined || selectedCurve === null) {
        return;
    }

    // Must have at least one curve
    if (costFnParams.length === 1) {
        return;
    }

    guidingCurves.splice(selectedCurve, 1);
    costFnParams.splice(selectedCurve, 1);

    setState({ guidingCurves, costFnParams, selectedCurve: null });
    addCostFn();
    addCostFunctionViz();
    addModel();
}

costControls.addEventListener('input', updateCostFnParams);
distanceMultiplierControls.forEach((control) => control.addEventListener('input', updateCostFnParams));
alignmentOffsetControl.addEventListener('input', updateCostFnParams);
alignmentMultiplierControl.addEventListener('input', updateCostFnParams);

deleteBtn.addEventListener('click', deleteCurve);
