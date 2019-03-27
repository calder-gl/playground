// Mondrian painting

const white = RGBColor.fromRGB(255, 255, 255);
const whiteCube = Shape.cube(Material.create({ color: white, shininess: 1 }));

const red = RGBColor.fromRGB(255, 0, 0);
const redCube = Shape.cube(Material.create({ color: red, shininess: 1 }));

const blue = RGBColor.fromRGB(0, 0, 255);
const blueCube = Shape.cube(Material.create({ color: blue, shininess: 1 }));

const yellow = RGBColor.fromRGB(255, 255, 0);
const yellowCube = Shape.cube(Material.create({ color: yellow, shininess: 1 }));

const black = RGBColor.fromRGB(0, 0, 0);
const blackCube = Shape.cube(Material.create({ color: black, shininess: 1 }));

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', { x: 1, y: 0, z: 0 });
});

const makeCube = (root, cube) => {
    const node = bone();
    node.point('base').stickTo(root);

    Generator.decorate(() => {
        if (cube === undefined) {
            cube = sample([whiteCube, redCube, blueCube, blackCube, yellowCube]);
        }
        node.createPoint('cubeOffset', { x: -0.5, y: 0, z: -0.5 });
        const shape = node.point('cubeOffset').attach(cube);
        shape.scale({ x: 1, y: 0.1, z: 1 });
    });

    [-0.25, 0.25].forEach((xOff) => {
        [-0.25, 0.25].forEach((zOff) => {
            const scaled = bone();
            scaled.point('base').stickTo(node.point('base'));
            scaled.createPoint('spawn', { x: 2*xOff, y: 0.5, z: 2*zOff });
            scaled.scale(0.5);
            Generator.addDetail({ component: 'maybeSquare', at: scaled.point('spawn') });
        });
    });
}

generator
    .define('START', (root) => {
        const node = bone();
        node.point('base').stickTo(root);
        node.scale(10);
        Generator.addDetail({ component: 'whiteSquare', at: node.point('base') });
    })
    .define('whiteSquare', (root) => {
        makeCube(root, whiteCube);
    })
    .define('square', (root) => {
        makeCube(root);
    })
    .defineWeighted('maybeSquare', 10, Generator.replaceWith('square'))
    .defineWeighted('maybeSquare', 1, () => {})
    .wrapUpMany(['square', 'whiteSquare', 'maybeSquare'], () => {})
    .thenComplete([]);
