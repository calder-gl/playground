// Your Calder code here

const bone = Armature.define((root) => {
    root.createPoint('base', vec3.fromValues(0, 0, 0));
    root.createPoint('tip', vec3.fromValues(0, 1, 0));
});

const node1 = bone();
const node2 = bone();
node2.point('base').stickTo(node1.point('tip'));

renderer.camera.moveTo(vec3.fromValues(0, 0, 8));
renderer.camera.lookAt(vec3.fromValues(2, 2, -4));

renderer.eachFrame(() => {
    return {
        objects: [node1],
        debugParams: { drawAxes: true, drawArmatureBones: true }
    };
});
