/**
 * Write your Calder code here
 */

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
});

const node = bone();

const light1 = new Light({
    position: { x: 10, y: 10, z: 10 },
    color: RGBColor.fromHex('#FFFFFF'),
    intensity: 256
});
renderer.addLight(light1);

renderer.camera.moveTo({ x: 0, y: 0, z: 8 });
renderer.camera.lookAt({ x: 2, y: 2, z: -4 });

renderer.draw([node], {drawAxes: true, drawArmatureBones: true});
