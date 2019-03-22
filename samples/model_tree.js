// Tree with model leaves and trunk

// Setup leaf
const leafColor = RGBColor.fromRGB(204, 255, 204);
const leaf = loadObj('leaves', 'leaves');

// Setup branch
const branchColor = RGBColor.fromRGB(102, 76.5, 76.5);
const branchMaterial = Material.create({ color: branchColor, shininess: 1 });
const branch = loadObj('trunk', 'trunk');

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', { x: 1, y: 0, z: 0 });
});

generator
    .define('START', Generator.replaceWith('branch'))
    .define('branch', (root) => {
        const node = bone();
        node.point('base').stickTo(root);
        node.scale(Math.random() * 0.4 + 0.9);
        node
            .hold(node.point('tip'))
            .rotate(Math.random() * 360)
            .release();
        node
            .hold(node.point('handle'))
            .rotate(Math.random() * 80)
            .release();
        node.scale(0.7); // Shrink a bit

        Generator.decorate(() => {
            const trunkBone = bone();
            
            const trunk = trunkBone.point('mid').attachModel(branch);
            trunk.scale({ x: 0.2, y: 0.5, z: 0.2 });

            trunkBone.point('mid').stickTo(node.point('mid'));
        });

        Generator.addDetail({ component: 'branchOrLeaf', at: node.point('tip') });
    })
    .defineWeighted('branchOrLeaf', 1, Generator.replaceWith('leaf'))
    .defineWeighted('branchOrLeaf', 4, (root) => {
        Generator.addDetail({ component: 'branch', at: root });
        Generator.addDetail({ component: 'maybeBranch', at: root });
        Generator.addDetail({ component: 'maybeBranch', at: root });
    })
    .define('leaf', (root) => {
        const leafBone = bone();
        leafBone.createPoint('leafAnchor', {x: 0.6, y: 0.2, z: 0.9});
        leafBone
            .hold(leafBone.point('base'))
            .grab(leafBone.point('tip'))
            .pointAt({x: 0, y: 0, z: -20})
            .release();
        leafBone.point('leafAnchor').attachModel(leaf);
        leafBone.scale(Math.random() + 0.4);
        leafBone.point('base').stickTo(root);
    })
    .maybe('maybeBranch', (root) => {
        Generator.addDetail({ component: 'branch', at: root });
    })
    .wrapUpMany(['branch', 'branchOrLeaf', 'maybeBranch'], Generator.replaceWith('leaf'))
    .thenComplete(['leaf']);
