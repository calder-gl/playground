// Treehouse

const brickColor = RGBColor.fromRGB(232, 232, 202);
const houseBody = Shape.cube(Material.create({ color: brickColor, shininess: 100 }));

const roofColor = RGBColor.fromRGB(232, 100, 100);
const roofBody = Shape.cube(Material.create({ color: roofColor, shininess: 100 }));

const supportColor = RGBColor.fromRGB(132, 50, 50);
const supportBody = Shape.cube(Material.create({ color: supportColor, shininess: 100 }));

const windowColor = RGBColor.fromRGB(100, 200, 240);
const windowBody = Shape.cube(Material.create({ color: windowColor, shininess: 200 }));

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', { x: 1, y: 0, z: 0 });
});

const addBlock = (node, offset, size, rescale) => {
    node.createPoint('blockOffset', offset);
    
    Generator.decorate(() => {
        houseNode = bone();
        houseNode.point('base').stickTo(node.point('blockOffset'));
        
        houseNode.createPoint('houseLocation', { x: -size.x/2, y: 0, z: -size.z/2 });
        const body = houseNode.point('houseLocation').attach(houseBody);
        body.scale(size);
        
        houseNode.createPoint('roofLocation', { x: -size.x/2-0.05, y: size.y-0.05, z: -size.z/2-0.05 });
        const roof = houseNode.point('roofLocation').attach(roofBody);
        roof.scale({ x: size.x + 0.1, y: 0.1, z: size.z + 0.1 });
    });
    
    node.createPoint('topSpawn', { x: offset.x, y: offset.y + size.y, z: offset.z });
    topBone = bone().scale(rescale);
    topBone.point('base').stickTo(node.point('topSpawn'));
    Generator.addDetail({ component: 'top', at: topBone.point('base') });
    
    [0, 90, 180, 270].forEach((angle) => {
        const sideNode = bone().scale(rescale);
        const yOff = 0.3;
        sideNode.createPoint('sideSpawn', { x: size.x/2, y: yOff, z: 0 });
        sideNode.point('base').stickTo(node.point('blockOffset'));
        sideNode.hold(sideNode.point('tip')).rotate(angle).release();
        Generator.addDetail({ component: 'side', at: sideNode.point('sideSpawn') });
    });
};

const addWindow = (node, offset) => {
    const width = 0.2;
    const pointName = `window${offset}`;
    node.createPoint(pointName, {...offset, z: offset.z - width/2});
    
    win = node.point(pointName).attach(windowBody);
    win.scale({ x: 0.02, y: width, z: width });  
};

generator
    .define('START', (root) => {
        const node = bone();
        node.point('base').stickTo(root);
        node.scale(Math.random() * 0.4 + 0.9);
        node
            .hold(node.point('tip'))
            .rotate(Math.random() * 360)
            .release();
        addBlock(node, {x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1}, 1);
    })
    .define('top', (root) => {
        const node = bone();
        node.point('base').stickTo(root);
        node.scale(Math.random() * 0.4 + 0.9);
        node.scale(0.8); // Shrink a bit
        addBlock(node, {x: 0, y: 0.3, z: 0}, {x: 0.8, y: 0.8, z: 0.8}, 1);
        
        Generator.decorate(() => {
            [-1, 1].forEach((xOff) => {
                [-1, 1].forEach((zOff) => {
                    const pointName = `support${xOff},${zOff}`;
                    node.createPoint(pointName, { x: xOff*0.2, y: 0, z: zOff*0.2 });
                    const support = node.point(pointName).attach(supportBody);
                    support.scale({ x: 0.05, y: 0.3, z: 0.05 });
                });
            });
        });
    })
    .define('top', (root) => {
        // no stilts
        const node = bone();
        node.point('base').stickTo(root);
        node.scale(Math.random() * 0.4 + 0.6);
        /*node
            .hold(node.point('tip'))
            .rotate(Math.random() * 360)
            .release();*/
        addBlock(node, {x: 0, y: 0, z: 0}, {x: 1, y: 1, z: 1}, 1);
    })
    .define('top', () => {})
    .wrapUp('top', () => {})
    
    .define('side', (root) => {
        const node = bone();
        node.point('base').stickTo(root);
        node.scale(Math.min(1, Math.random() * 0.4 + 0.6)); // Random resize
        addBlock(node, {x: 0.35, y: 0.5, z: 0}, {x: 0.7, y: 1, z: 0.7}, 0.8);
        
        Generator.decorate(() => {
            [-1, 1].forEach((zOff) => {
                const pointName = `support${zOff}`;
                node.createPoint(pointName, { x: 0, y: 0, z: zOff*0.2 });
                const support = node.point(pointName).attach(supportBody);
                support.scale({ x: 0.05, y: 0.8, z: 0.05 });
                support.createPoint('handle', {x:0, y:0, z:1});
                support.hold(support.point('handle')).rotate(45).release();
            });
        });
    })
    .defineWeighted('side', 0.5, Generator.replaceWith('maybeWindow'))
    .defineWeighted('side', 0.5, () => {})
    .wrapUp('side', Generator.replaceWith('maybeWindow'))
    
    .define('maybeWindow', (root) => {
        const node = bone();
        node.point('base').stickTo(root);
        
        if (Math.random() > 0.3) addWindow(node, { x: 0, y: 0.15, z: 0.15 });
        if (Math.random() > 0.3) addWindow(node, { x: 0, y: 0.15, z: -0.15 });
    })
    
    .thenComplete(['maybeWindow']);
