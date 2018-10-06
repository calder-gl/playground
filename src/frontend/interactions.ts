import { Camera } from 'calder-gl';
import { renderer } from './renderer';
import { quat, vec3 } from 'gl-matrix';

enum ControlMode {
    SELECT_CURVE,
    DRAW_CURVE,
    CAMERA_ROTATE,
    CAMERA_ZOOM
}

type ControlState = {
    mode: ControlMode;
};

const state: ControlState = {
    mode: ControlMode.CAMERA_ROTATE
};

const LEFT = 0;
const MIDDLE = 1;
const RIGHT = 2;

function handleMouseDown(event: MouseEvent) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    if (event.button === LEFT) {
        state.mode = ControlMode.CAMERA_ROTATE;

    // TODO think through other interactions
    } else if (event.button === MIDDLE) {
        state.mode = ControlMode.DRAW_CURVE;
    } else if (event.button === RIGHT) {
        state.mode = ControlMode.SELECT_CURVE;
    }
}

function handleMouseUp() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
}

const tmpQuat = quat.create();
const tmpVec3 = vec3.create();
const tmpDirection = vec3.create();
function handleMouseMove(event: MouseEvent) {
    if (state.mode === ControlMode.CAMERA_ROTATE) {
        renderer.camera.rotateAboutTarget(quat.setAxisAngle(
            tmpQuat,
            Camera.up,
            -event.movementX / 100
        ));

        const direction = vec3.sub(tmpDirection, renderer.camera.target, renderer.camera.position)
        vec3.normalize(direction, direction);
        const directionDotUp = vec3.dot(Camera.up, direction);
        if (Math.abs(directionDotUp) < 0.98 || event.movementY * directionDotUp > 0) {
            const axis = vec3.cross(
                tmpVec3,
                Camera.up,
                direction);
            vec3.normalize(axis, axis);
                renderer.camera.rotateAboutTarget(quat.setAxisAngle(
                    tmpQuat,
                    axis,
                    event.movementY / 100
                ));
        }
    }

    event.stopPropagation();
}

export const setupOnscreenInteractions = () => {
    // Set up initial position
    renderer.camera.lookAt({ x: 0, y: 2, z: 0 });
    renderer.camera.moveToWithFixedTarget({
        x: 0,
        y: 2,
        z: 8
    });

    renderer.stage.addEventListener('mousedown', handleMouseDown);
}
