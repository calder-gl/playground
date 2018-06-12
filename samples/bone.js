/**
 * Write your Calder code here
 */

// Create a 'bone'
const bone = Armature.define((root) => {
  root.createPoint('base', { x: 0, y: 0, z: 0 });
  root.createPoint('tip',  { x: 0, y: 1, z: 0 });
});

// Stick the 'base' of node2 to the 'tip' of node1
const node1 = bone();
const node2 = bone();
node2.point('base').stickTo(node1.point('tip'));

// Move the camera, and look at a certain point
renderer.camera.moveTo({ x: 0, y: 0, z: 8 });
renderer.camera.lookAt({ x: 2, y: 2, z: -4 });

// Render objects 'node1' with 'debugParams'
renderer.eachFrame(() => {
  return {
    objects: [node1],
    debugParams: { drawAxes: true, drawArmatureBones: true }
  };
});
