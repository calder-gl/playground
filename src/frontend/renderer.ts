import * as calder from 'calder-gl';

import { state } from './state';

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

renderer.camera.lookAt({ x: 0, y: 2, z: 0 });

// Draw the armature
let angle = 0;
const draw = () => {
    angle += 0.001;
    renderer.camera.moveToWithFixedTarget({
        x: Math.cos(angle) * 8,
        y: 2,
        z: -Math.sin(angle) * 8
    });

    return {
        objects: state.model ? [state.model] : [],
        debugParams: {
            drawAxes: true,
            drawArmatureBones: false,
            drawVectorField: state.vectorField,
            drawGuidingCurve: state.guidingCurve
        }
    };
};

// Apply the constraints each frame.
renderer.eachFrame(draw);