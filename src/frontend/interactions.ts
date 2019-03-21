import { Camera, vec3ToVector } from 'calder-gl';
import { renderer } from './renderer';
import { commit, currentState } from './state'
import { addCostFn, addCostFunctionViz, addNewCurve } from './costFn';
import { addModel } from './model';
import { mat4, quat, vec3, vec4 } from 'gl-matrix';

// tslint:disable-next-line:import-name
import Bezier = require('bezier-js');

enum ControlMode {
    DRAG_CURVE,
    DRAW_CURVE,
    CAMERA_ROTATE,
    CAMERA_MOVE
}

type ControlcontrolState = {
    mode: ControlMode;
    selectedHandle: number | null;
    dragged: boolean;
    lastMouse: { x: number, y: number } | null;
};

const controlState: ControlcontrolState = {
    mode: ControlMode.CAMERA_ROTATE,
    selectedHandle: null,
    dragged: false,
    lastMouse: null
};

enum MouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2
}

const MIN_SQUARED_DISTANCE = 16;

function handleMouseDown(event: MouseEvent) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    controlState.dragged = false;
    controlState.lastMouse = { x: event.clientX, y: event.clientY };

    const button = <MouseButton>event.button;

    if (button === MouseButton.LEFT) {
        if (event.shiftKey) {
            controlState.mode = ControlMode.CAMERA_MOVE;
        } else if (event.ctrlKey || event.metaKey) {
            controlState.mode = ControlMode.DRAW_CURVE;

            const bounds = renderer.stage.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;

            currentState.setState({ pencilLine: [{ x, y }] });
        } else {
            controlState.selectedHandle = null;
            let closestDistance = Infinity;

            const { guidingCurves, selectedCurve } = currentState.asBakedType();

            if (guidingCurves && selectedCurve !== null && selectedCurve !== undefined) {
                const bounds = renderer.stage.getBoundingClientRect();
                const x = event.clientX - bounds.left;
                const y = event.clientY - bounds.top;

                guidingCurves.get(selectedCurve).bezier.points.forEach((point, index) => {
                    const screenPoint = renderer.pointInScreenSpace(point);
                    const dx = screenPoint.x - x;
                    const dy = screenPoint.y - y;
                    const distance = dx * dx + dy * dy;

                    if (distance < MIN_SQUARED_DISTANCE && distance < closestDistance) {
                        closestDistance = distance;
                        controlState.selectedHandle = index;
                    }
                });
            }

            if (controlState.selectedHandle !== null) {
                controlState.mode = ControlMode.DRAG_CURVE;
            } else {
                controlState.mode = ControlMode.CAMERA_ROTATE;
            }
        }
    }

    event.stopPropagation();
    event.preventDefault();
}

function handleMouseUp(event: MouseEvent) {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    controlState.lastMouse = null;

    const { guidingCurves } = currentState.asBakedType();
    if (!controlState.dragged && guidingCurves) {
        const boundingRect = renderer.stage.getBoundingClientRect();
        const selectedIndex = renderer.findCurveUnderCursor(guidingCurves.toJS(), {
            x: event.clientX - boundingRect.left,
            y: event.clientY - boundingRect.top
        });

        currentState.setState({ selectedCurve: selectedIndex < guidingCurves.size ? selectedIndex : null });
        commit();
    }

    if (controlState.mode === ControlMode.DRAG_CURVE) {
        addCostFn();
        addCostFunctionViz();
        addModel();
        commit();
    } else if (controlState.mode === ControlMode.DRAW_CURVE) {
        const { pencilLine } = currentState.asBakedType();
        if (pencilLine) {
            addNewCurve(pencilLine);
            addCostFn();
            addCostFunctionViz();
            addModel();
            currentState.setState({ pencilLine: undefined });

            const { guidingCurves } = currentState.asBakedType();
            if (guidingCurves) {
                const selectedCurve = guidingCurves.size - 1;
                currentState.setState({ selectedCurve, guidingCurves });
                commit();
            }
        }
    }

    event.stopPropagation();
    event.preventDefault();
}

const tmpQuat = quat.create();
const tmpVec3 = vec3.create();
const tmpDirection = vec3.create();
const tmpMat4 = mat4.create();

function handleMouseMove(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    const nextMouse = { x: event.clientX, y: event.clientY };

    if (!controlState.lastMouse) {
        return;
    }

    const movement = {
        x: nextMouse.x - controlState.lastMouse.x,
        y: nextMouse.y - controlState.lastMouse.y
    };

    controlState.dragged = true;
    controlState.lastMouse = nextMouse;

    if (controlState.mode === ControlMode.DRAW_CURVE) {
        const { pencilLine } = currentState.asBakedType();

        if (pencilLine) {
            const bounds = renderer.stage.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;

            pencilLine.push({ x, y });
            currentState.setState({ pencilLine });
        }
    } else if (controlState.mode === ControlMode.DRAG_CURVE) {
        // Create a direction vector representing the relative movement we want, normalized to the screen size
        const direction = vec3ToVector(
            vec3.set(tmpDirection, movement.x / renderer.width, -movement.y / renderer.height, 0));

        const { guidingCurves, selectedCurve, costFnParams } = currentState.asBakedType();

        // Bring the transform into world coordinates by applying the inverse camera transform
        const inverseTransform = mat4.invert(tmpMat4, renderer.camera.getTransform());

        if (inverseTransform && guidingCurves && costFnParams && selectedCurve !== undefined && selectedCurve !== null && controlState.selectedHandle !== null) {
            const points = costFnParams.get(selectedCurve).bezier.points;

            // We need to scale the direction vector so that when the control point moves, it moves the right
            // amount in screen space. The normalized direction before is implicitly at a distance of 1 away
            // from the camera (`zNear` in the projection matrix.) We know the position of the point and the
            // camera, and the camera has a field of view of pi/4, so we can do some trig:
            //
            //                           .-X control point
            //                        .-'  |
            //         distance    .-'     |
            //                  .-'        |
            //               .-'|          |
            //         h  .-'   |          |
            //         .-'      |          |
            // camera X---------+----------+
            //                  1
            //
            // The scaling factor we need is distance/h, and h is 1/cos(pi/4).

            const dx = points[controlState.selectedHandle].x - renderer.camera.position[0];
            const dy = points[controlState.selectedHandle].y - renderer.camera.position[1];
            const dz = points[controlState.selectedHandle].z - renderer.camera.position[2];
            const distanceFromCamera = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const scale = distanceFromCamera * Math.cos(Math.PI / 4);

            vec4.scale(direction, direction, scale);
            vec4.transformMat4(direction, direction, inverseTransform);

            points[controlState.selectedHandle] = {
                x: points[controlState.selectedHandle].x + direction[0],
                y: points[controlState.selectedHandle].y + direction[1],
                z: points[controlState.selectedHandle].z + direction[2]
            };
            const bezier = new Bezier(points);

            const newParams = { ...costFnParams.get(selectedCurve), bezier };

            // Update the path that gets visualized without replacing the whole cost function yet;
            // since that's a more expensive operation, we'll do that on mouse up
            const newGuidingCurve = {
                ...guidingCurves.get(selectedCurve),
                bezier,
                path: bezier.getLUT().map((p) => [p.x, p.y, p.z])
            };

            currentState.setState({
                costFnParams: costFnParams.set(selectedCurve, newParams),
                guidingCurves: guidingCurves.set(selectedCurve, newGuidingCurve)
            });
        }
    } else if (controlState.mode === ControlMode.CAMERA_MOVE) {
        // Create a direction vector representing the relative movement we want
        const direction = vec3ToVector(
            vec3.set(tmpDirection, -movement.x / 100, movement.y / 100, 0));

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
    } else if (controlState.mode === ControlMode.CAMERA_ROTATE) {
        // First rotate around the vertical axis
        renderer.camera.rotateAboutTarget(quat.setAxisAngle(
            tmpQuat,
            Camera.up,
            -movement.x / 100
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
        if (Math.abs(directionDotUp) < 0.98 || movement.y * directionDotUp > 0) {
            const axis = vec3.cross(
                tmpVec3,
                Camera.up,
                direction);
            vec3.normalize(axis, axis);
            renderer.camera.rotateAboutTarget(quat.setAxisAngle(
                tmpQuat,
                axis,
                movement.y / 100
            ));
        }
    }
}

function handleWheel(event: WheelEvent) {
    // Move towards or away from the camera's target relative to the scroll amount, avoiding
    // moving ALL the way to the target by capping the amount at 0.9 instead of 1.
    renderer.camera.moveTowardsTarget(Math.min(0.9, event.deltaY / 200));

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
