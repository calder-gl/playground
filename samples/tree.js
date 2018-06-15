/**
 * Write your Calder code here
 */

const light1 = {
    lightPosition: [10, 10, 10],
    lightColor: [0.3, 0.3, 0.3],
    lightIntensity: 256
};
const light2 = {
    lightPosition: [700, 500, 50],
    lightColor: [0.3, 0.3, 0.3],
    lightIntensity: 100
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Step 1: create geometry
///////////////////////////////////////////////////////////////////////////////////////////////////

// Add lights to the renderer
renderer.addLight(light1);
renderer.addLight(light2);

// Setup leaf
const leafColor = RGBColor.fromRGB(204, 255, 204);
const workingLeafSphere = Shape.sphere(leafColor);
const leafSphere = workingLeafSphere.bake();

// Setup branch
const branchColor = RGBColor.fromRGB(102, 76.5, 76.5);
const workingBranchShape = Shape.cylinder(branchColor);
const branchShape = workingBranchShape.bake();

///////////////////////////////////////////////////////////////////////////////////////////////////
// Step 2: create armature
///////////////////////////////////////////////////////////////////////////////////////////////////

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
});

const treeGen = Armature.generator();
const tree = treeGen
    .define('branch', 1, (root) => {
        const node = bone();
        node.point('base').stickTo(root);
        const theta = Math.random() * 45;
        const phi = Math.random() * 360;
        node.setRotation(Matrix.fromQuat4(Quaternion.fromEuler(theta, phi, 0)));
        node.setScale(Matrix.fromScaling({ x: 0.8, y: 0.8, z: 0.8 })); // Shrink a bit

        const trunk = node.point('mid').attach(branchShape);
        trunk.setScale(Matrix.fromScaling({ x: 0.2, y: 1, z: 0.2 }));

        // branching factor of 2
        treeGen.addDetail({ component: 'branchOrLeaf', at: node.point('tip') });
        treeGen.addDetail({ component: 'branchOrLeaf', at: node.point('tip') });
    })
    .define('branchOrLeaf', 1, (root) => {
        treeGen.addDetail({ component: 'leaf', at: root });
    })
    .define('branchOrLeaf', 4, (root) => {
        treeGen.addDetail({ component: 'branch', at: root });
    })
    .define('leaf', 1, (root) => {
        const leaf = root.attach(leafSphere);
        const scale = Math.random() * 0.5 + 0.5;
        leaf.setScale(Matrix.fromScaling({ x: scale, y: scale, z: scale }));
    })
    .generate({ start: 'branch', depth: 15 });

///////////////////////////////////////////////////////////////////////////////////////////////////
// Step 3: set up renderer
///////////////////////////////////////////////////////////////////////////////////////////////////

document.body.appendChild(renderer.stage);

renderer.camera.moveTo({ x: 0, y: 0, z: 8 });
renderer.camera.lookAt({ x: 2, y: 2, z: -4 });

// Draw the armature
const draw = () => {
    return {
        objects: [tree],
        debugParams: { drawAxes: true, drawArmatureBones: false }
    };
};

// Apply the constraints each frame.
renderer.eachFrame(draw);