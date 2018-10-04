// Setup leaf
const leafColor = RGBColor.fromRGB(204, 255, 204);
const leafSphere = Shape.sphere(Material.create({ color: leafColor, shininess: 100 }));

// Setup branch
const branchColor = RGBColor.fromRGB(102, 76.5, 76.5);
const branchShape = Shape.cylinder(Material.create({ color: branchColor, shininess: 1 }));

///////////////////////////////////////////////////////////////////////////////////////////////////
// Step 2: create armature
///////////////////////////////////////////////////////////////////////////////////////////////////

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', { x: 1, y: 0, z: 0 });
});

generator
    .define('START', Generator.replaceWith('branch'))
    .define('branch', (root, instance) => {
        const node = instance.add(bone());
        node.point('base').stickTo(root);
        node.scale(Math.random() * 0.4 + 0.9);
        node
            .hold(node.point('tip'))
            .rotate(Math.random() * 360)
            .release();
        node
            .hold(node.point('handle'))
            .rotate(Math.random() * 70)
            .release();
        node.scale(0.8); // Shrink a bit

        const trunk = instance.add(node.point('mid').attach(branchShape));
        trunk.scale({ x: 0.2, y: 1, z: 0.2 });

        instance.addDetail({ component: 'branchOrLeaf', at: node.point('tip') });
    })
    .defineWeighted('branchOrLeaf', 1, Generator.replaceWith('leaf'))
    .defineWeighted('branchOrLeaf', 4, (root, instance) => {
        instance.addDetail({ component: 'branch', at: root });
        instance.addDetail({ component: 'maybeBranch', at: root });
        instance.addDetail({ component: 'maybeBranch', at: root });
    })
    .define('leaf', (root, instance) => {
        const leaf = instance.add(root.attach(leafSphere));
        leaf.scale(Math.random() * 0.5 + 0.5);
    })
    .maybe('maybeBranch', (root, instance) => {
        instance.addDetail({ component: 'branch', at: root });
    })
    .wrapUpMany(['branch', 'branchOrLeaf', 'maybeBranch'], Generator.replaceWith('leaf'))
    .thenComplete(['leaf']);
