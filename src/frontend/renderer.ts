import * as calder from 'calder-gl';

import { currentState } from './state';

// Create the renderer
export const ambientLightColor = calder.RGBColor.fromRGB(90, 90, 90);
export const renderer: calder.Renderer = new calder.Renderer({
    width: 400,
    height: 400,
    maxLights: 2,
    ambientLightColor,
    backgroundColor: calder.RGBColor.fromHex('#FFDDFF')
});

// Create light sources for the renderer
const light1: calder.Light = calder.Light.create({
    position: { x: 10, y: 10, z: 10 },
    color: calder.RGBColor.fromHex('#FFFFFF'),
    strength: 200
});

// Add lights to the renderer
renderer.addLight(light1);

const rendererSettings = {
    showVectorField: true,
    showBones: false
};

// Draw the armature
const draw = () => {
    const { model, vectorField, guidingCurves, pencilLine } = currentState.getUnderlyingObject();

    return {
        objects: model ? [model] : [],
        debugParams: {
            drawAxes: true,
            drawArmatureBones: rendererSettings.showBones,
            drawVectorField: rendererSettings.showVectorField ? vectorField : undefined,
            drawGuidingCurve: guidingCurves && guidingCurves.toJS(),
            drawPencilLine: pencilLine
        }
    };
};

// Apply the constraints each frame.
renderer.eachFrame(draw);

// Set up checkboxes for settings
const vectorFieldCheckbox = <HTMLInputElement>document.getElementById('vectorField');
vectorFieldCheckbox.addEventListener('change', () => {
    rendererSettings.showVectorField = vectorFieldCheckbox.checked;
});

const bonesCheckbox = <HTMLInputElement>document.getElementById('bones');
bonesCheckbox.addEventListener('change', () => {
    rendererSettings.showBones = bonesCheckbox.checked;
});
