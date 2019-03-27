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

generator.define('START', (spawn) => {
    const base = bone();
    base.point('base').stickTo(spawn);
    base.hold(base.point('handle')).rotate(90);

    Generator.addDetail({component: 'segment or head', at: base.point('base')});
    Generator.addDetail({component: 'tail', at: base.point('base')});
});
generator.define('tail', (spawn) => {
   let point = spawn;
   range(4).forEach(() => {
       const tail = bone();
       tail.point('tip').stickTo(point);
       tail.scale(0.7);
       tail.point('mid').attach(segmentShape).scale({x: 0.5, y: 1.2, z: 0.3});
       point = tail.point('base');
   });
});
generator.defineWeighted('segment or head', 1, Generator.replaceWith('head'));
generator.defineWeighted('segment or head', 5, (spawn) => {
    const segment = segmentBone();
    segment.point('base').stickTo(spawn);
    segment.hold(segment.point('handle')).rotate(Math.random()*90 - 45).release();

    Generator.decorate(() => {
        segment.point('mid').attach(segmentShape).scale({x: 0.5, y: 1.2, z: 0.3});
    });

    Generator.addDetail({component: 'segment or head', at: segment.point('tip')});
});
generator.define('head', (spawn) => {
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
generator.wrapUp('segment or head', Generator.replaceWith('head'));
generator.thenComplete(['head', 'tail']);
