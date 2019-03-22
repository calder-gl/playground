// Simple tree

// Setup leaf
const leafColor = RGBColor.fromRGB(204, 255, 204);
const leafSphere = Shape.sphere(Material.create({ color: leafColor, shininess: 100 }));

// Setup branch
const branchColor = RGBColor.fromRGB(102, 76.5, 76.5);
const branchShape = Shape.cylinder(Material.create({ color: branchColor, shininess: 1 }));

// Create the definition for default control points that we can attach things to
const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', { x: 1, y: 0, z: 0 });
});

generator
    // START is always spawned first. We use it to create an initial branch of the tree
    .define('START', Generator.replaceWith('branch'))


    .define('branch', (root) => {
        // Attach a bone, given a random scale and rotation
        const node = bone();
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

        // Add a cylinder to the skeleton
        Generator.decorate(() => {
          const trunk = node.point('mid').attach(branchShape);
          trunk.scale({ x: 0.2, y: 1, z: 0.2 });
        });

        // At the tip of the branch, add a point where either more branches
        // or a leaf can be spawned
        Generator.addDetail({ component: 'branchOrLeaf', at: node.point('tip') });
    })

    // The spawn point at the end of a branch can turn into either a single leaf
    // or some number of branches
    .defineWeighted('branchOrLeaf', 1, Generator.replaceWith('leaf'))
    .defineWeighted('branchOrLeaf', 4, (root) => {
        // If we decided to make branches instead of a leaf, we want at least one
        // branch to spawn. Optionally, up to two more can also be spawned.
        Generator.addDetail({ component: 'branch', at: root });
        Generator.addDetail({ component: 'maybeBranch', at: root });
        Generator.addDetail({ component: 'maybeBranch', at: root });
    })

    // `maybe` components either use your generating function or do nothing,
    // with equal probability
    .maybe('maybeBranch', (root) => {
        Generator.addDetail({ component: 'branch', at: root });
    })
    
    // If we want to cut off model generation early, we want to replace these leftover spawn
    // points with leaves instead of doing nothing
    .wrapUpMany(['branch', 'branchOrLeaf', 'maybeBranch'], Generator.replaceWith('leaf'))

    // Hold off on expanding leaf spawn points until the very end, as they produce geometry
    // and no skeleton
    .define('leaf', (root) => {
        const leaf = root.attach(leafSphere);
        leaf.scale(Math.random() * 0.5 + 0.5);
    })
    .thenComplete(['leaf']);
