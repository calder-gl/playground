// Tree

const light = Light.create({
    position: { x: 10, y: 10, z: 10 },
    color: RGBColor.fromHex('#FFFFFF'),
    strength: 300
});

// Add lights to the renderer
renderer.addLight(light);

// Setup leaf
const leafColor = RGBColor.fromRGB(204, 255, 204);
const workingLeafSphere = Shape.sphere(Material.create({
    color: leafColor,
    shininess: 20
}));
const leafSphere = workingLeafSphere.bake();

// Setup branch
const branchColor = RGBColor.fromRGB(102, 76.5, 76.5);
const workingBranchShape = Shape.cylinder(Material.create({
    color: branchColor,
    shininess: 1
}));
const branchShape = workingBranchShape.bake();

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', { x: 1, y: 0, z: 0 });
});

const treeGen = Armature.generator();
treeGen.define('branch', (root) => {
    const node = bone();
    node.point('base').stickTo(root);
    node.hold(node.point('tip')).rotate(Math.random() * 360).release();
    node.hold(node.point('handle')).rotate(Math.random() * 45).release();
    node.scale(0.8); // Shrink a bit

    const trunk = node.point('mid').attach(branchShape);
    trunk.scale({ x: 0.2, y: 1, z: 0.2 });

    treeGen.addDetail({ component: 'branchOrLeaf', at: node.point('tip') });
})
.defineWeighted('branchOrLeaf', 1, (root) => {
    treeGen.addDetail({ component: 'leaf', at: root });
})
.defineWeighted('branchOrLeaf', 4, (root) => {
    treeGen.addDetail({ component: 'branch', at: root });
    treeGen.addDetail({ component: 'maybeBranch', at: root });
    treeGen.addDetail({ component: 'maybeBranch', at: root });
})
.define('leaf', (root) => {
    const leaf = root.attach(leafSphere);
    leaf.scale(Math.random() * 0.5 + 0.5);
})
.defineWeighted('maybeBranch', 1, (root) => {})
.defineWeighted('maybeBranch', 1, (root) => {
    treeGen.addDetail({ component: 'branch', at: root });
});
const tree = treeGen.generate({ start: 'branch', depth: 25 });

renderer.camera.moveTo({ x: 0, y: 0, z: 8 });
renderer.camera.lookAt({ x: 0, y: 2, z: -4 });

renderer.draw([tree], {drawAxes: true, drawArmatureBones: false});
