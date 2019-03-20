// Snake

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', { x: 1, y: 0, z: 0});
});

const segmentBone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', {x: 0, y: 0, z: 1});
});

const snakeMaterial = Material.create({
    color: RGBColor.fromHex('#90C3D4')
        .mix(RGBColor.fromHex('#71E366'), Math.random()),
    shininess: 256
});
const segmentShape = Shape.cylinder(snakeMaterial).bake();
const headShape = Shape.sphere(snakeMaterial).bake();
const eyeShape = Shape.sphere(Material.create({
    color: RGBColor.fromHex('#FFFFFF'),
    shininess: 256
})).bake();
const pupilShape = Shape.sphere(Material.create({
    color: RGBColor.fromHex('#000000'),
    shininess: 0
})).bake();

const snake = Armature.generator();
snake.define('base', (spawn) => {
    const base = bone();
    base.point('base').stickTo(spawn);
    base.hold(base.point('handle')).rotate(90);

    snake.addDetail({component: 'segment or head', at: base.point('base')});
    snake.addDetail({component: 'tail', at: base.point('base')});
});
snake.define('tail', (spawn) => {
   let point = spawn;
   range(4).forEach(() => {
       const tail = bone();
       tail.point('tip').stickTo(point);
       tail.scale(0.7);
       tail.point('mid').attach(segmentShape).scale({x: 0.5, y: 1.2, z: 0.3});
       point = tail.point('base');
   });
});
snake.defineWeighted('segment or head', 1, (spawn) => {
    const head = bone();
    head.createPoint('eye1', {x: 0.4, y: 0.5, z: 0.4});
    head.createPoint('eye2', {x: -0.4, y: 0.5, z: 0.4});
    head.createPoint('pupil1', {x: 0.45, y: 0.65, z: 0.4});
    head.createPoint('pupil2', {x: -0.45, y: 0.65, z: 0.4});
    head.point('base').stickTo(spawn);
    head.point('mid').attach(headShape).scale({x: 0.7, y: 0.8, z: 0.4});
    head.point('eye1').attach(eyeShape).scale(0.2);
    head.point('eye2').attach(eyeShape).scale(0.2);
    head.point('pupil1').attach(pupilShape).scale(0.1);
    head.point('pupil2').attach(pupilShape).scale(0.1);
});
snake.defineWeighted('segment or head', 3, (spawn) => {
    const segment = segmentBone();
    segment.point('base').stickTo(spawn);
    segment.point('mid').attach(segmentShape).scale({x: 0.5, y: 1.2, z: 0.3});
    segment.hold(segment.point('handle')).rotate(Math.random()*90 - 45).release();
    snake.addDetail({component: 'segment or head', at: segment.point('tip')});
});

const node = snake.generate({ start: 'base', depth: 20});
node.hold({x: 0, y: 0, z: 0}).hold({x: 0, y: 1, z: 0}).rotate(-120).release();

const light = Light.create({
    position: { x: 15, y: 15, z: 15 },
    color: RGBColor.fromHex('#FFFFFF'),
    strength: 400
});
renderer.addLight(light);

renderer.camera.moveTo({ x: 8, y: 20, z: 25 });
renderer.camera.lookAt({ x: 2, y: 2, z: -4 });

renderer.draw([node], {drawAxes: true, drawArmatureBones: false});
