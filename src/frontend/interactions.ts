import { Camera, vec3ToVector } from 'calder-gl';
import { renderer } from './renderer';
import { mat4, quat, vec3, vec4 } from 'gl-matrix';

enum ControlMode {
    SELECT_CURVE,
    DRAW_CURVE,
    CAMERA_ROTATE,
    CAMERA_MOVE
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
        if (event.shiftKey) {
            state.mode = ControlMode.CAMERA_MOVE;
        } else {
            state.mode = ControlMode.CAMERA_ROTATE;
        }

    // TODO think through other interactions
    } else if (event.button === MIDDLE) {
        state.mode = ControlMode.DRAW_CURVE;
    } else if (event.button === RIGHT) {
        state.mode = ControlMode.SELECT_CURVE;
    }

    event.stopPropagation();
    event.preventDefault();
}

function handleMouseUp(event: MouseEvent) {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    event.stopPropagation();
    event.preventDefault();
}

const tmpQuat = quat.create();
const tmpVec3 = vec3.create();
const tmpDirection = vec3.create();
const tmpMat4 = mat4.create();
function handleMouseMove(event: MouseEvent) {
    if (state.mode === ControlMode.CAMERA_MOVE) {
        // Create a direction vector representing the relative movement we want
        const direction = vec3ToVector(
            vec3.set(tmpDirection, -event.movementX / 100, event.movementY / 100, 0));

        // Bring the transform into world coordinates by applying the inverse camera transform
        const inverseTransform = mat4.invert(tmpMat4, renderer.camera.getTransform());
        if (inverseTransform) {
            vec4.transformMat4(direction, direction, inverseTransform);

            // Move the camera
            renderer.camera.moveBy({
                x: direction[0],
                y: direction[1],
                z: direction[2]
            });
        }

    } else if (state.mode === ControlMode.CAMERA_ROTATE) {

        // First rotate around the vertical axis
        renderer.camera.rotateAboutTarget(quat.setAxisAngle(
            tmpQuat,
            Camera.up,
            -event.movementX / 100
        ));

        // Then, to find the secondary axis to rotate around, we need the cross product of the
        // current camera direction and the vertical axis.
        //
        // We don't want to get into a situation where the camera is pointing directly up, because
        // then we can't do the cross product. If the normalized direction dot the up vector is 1,
        // that means they're exactly the same. So, we only allow rotation along this axis if we're
        // decently far away from 1, or if rotating would bring the directions farther apart.
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
    event.preventDefault();
}

function handleWheel(event: WheelEvent) {
    // Move towards or away from the camera's target relative to the scroll amount, avoiding
    // moving ALL the way to the target by capping the amount at 0.9 instead of 1.
    renderer.camera.moveTowardsTarget(Math.min(0.9, event.deltaY / 100));

    event.stopPropagation();
    event.preventDefault();
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
    renderer.stage.addEventListener('wheel', handleWheel);
}
