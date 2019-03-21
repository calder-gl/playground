// Cathedral

const peaked = loadObj('peaked', 'cathedral');
const pointed = loadObj('pointed', 'cathedral');
const cone = loadObj('cone', 'cathedral');
const windowBlock = loadObj('window', 'cathedral');
const cube = loadObj('cube', 'cathedral');

const bone = Armature.define((root) => {
    root.createPoint('base', { x: 0, y: 0, z: 0 });
    root.createPoint('mid', { x: 0, y: 0.5, z: 0 });
    root.createPoint('tip', { x: 0, y: 1, z: 0 });
    root.createPoint('handle', { x: 1, y: 0, z: 0 });
});

generator.define('START', Generator.replaceWith('base'))
.define('base', (root) => {
    const node = bone();
    node.point('base').stickTo(root);
    node.hold(node.point('tip')).rotate(-45).release();
    
    Generator.addDetail({ component: 'block', at: node.point('base') });
})
.define('block', (root) => {
    const node = bone();
    node.point('base').stickTo(root);
    const width = Math.random()*0.35 + 0.65;
    const height = Math.random()*0.35 + 0.65;
    const depth = width;
    node.createPoint('left', {x: -width/2, y: 0, z: depth/2});
    node.createPoint('right', {x: width/2, y: 0, z: depth/2});
    node.createPoint('back', {x: 0, y: 0, z: depth});
    node.createPoint('front', {x: 0, y: 0, z: 0});
    node.createPoint('top', {x: 0, y: height, z: depth / 2});
    
    Generator.decorate(() => {
        const blockNode = bone();
        blockNode.scale({x: width, y: height, z: depth});
        blockNode.point('base').stickTo(node.point('base'));
        blockNode.createPoint('blockHandle', {x: 0, y: 0.5, z: 0.5});
        blockNode.point('blockHandle').attachModel(cube);
    });
    
    const sideAnglePairs = [['left', 90], ['right', -90], ['back', 0], ['front', 180]];
    sideAnglePairs.forEach(([side, angle]) => {
        const sideBone = bone();
        sideBone.point('base').stickTo(node.point(side));
        sideBone.scale({ x: width, y: height, z: depth });
        sideBone.hold(sideBone.point('tip')).rotate(angle).release();
        Generator.addDetail({ component: 'blockOrFacade', at: sideBone.point('base') });
    });
    
    const topBone = bone();
    topBone.point('base').stickTo(node.point('top'));
    topBone.scale(width, height, depth);
    Generator.addDetail({ component: 'roofOrTower', at: topBone.point('base') });
})
.choice('blockOrFacade', [Generator.replaceWith('block'), Generator.replaceWith('facade')])
.wrapUp('blockOrFacade', Generator.replaceWith('facade'))
.define('facade', (root) => Generator.decorate(() => {
    const node = bone();
    node.point('base').stickTo(root);
    
    node.createPoint('left', {x: -0.4, y: 0.5, z: 0.05});
    node.createPoint('right', {x: 0.4, y: 0.5, z: 0.05});
    
    node.createPoint('windowLeft', {x: -0.2, y: 0.4, z: 0.05});
    node.createPoint('windowCenter', {x: 0, y: 0.4, z: 0.05});
    node.createPoint('windowRight', {x: 0.2, y: 0.4, z: 0.05});
    
    ['left', 'right'].forEach((side) => {
       node.point(side).attachModel(cube).scale({x: 0.2, y: 1, z: 0.1});
    });
    
    ['Left', 'Right', 'Center'].forEach((side) => {
       const block = node.point(`window${side}`).attachModel(windowBlock);
       block.scale({x: 0.1, y: 0.3, z: 0.05});
       block.createPoint('handle', {x: 0, y: 1, z: 0});
       block.hold(block.point('handle')).rotate(180).release();
    });
}))
.define('roofOrTower', Generator.replaceWith('roof'))
.define('roofOrTower', Generator.replaceWith('tower'))
.define('roofOrTower', (root) => {
    const node = bone();
    node.point('base').stickTo(root);
    node.createPoint('left', {x: -0.3, y: 0, z: 0.3});
    node.createPoint('right', {x: 0.3, y: 0, z: 0.3});
    
    ['left', 'right'].forEach((side) => {
       const sideBone = bone();
       sideBone.point('base').stickTo(node.point(side));
       sideBone.scale(0.9);
       Generator.addDetail({ component: 'tower', at: sideBone.point('base') });
    });
})
.define('roof', (root) => {
    root.attachModel(peaked).scale({x: 0.5, y: 0.3, z: 0.5});
})
.define('tower', (root) => {
    root.attachModel(cone).scale(0.35);
    const towerTip = bone();
    towerTip.point('base').stickTo(root);
})
.wrapUp('tower', (root) => {
    root.attachModel(cone).scale(0.35);
})
.define('tower', (root) => {
    Generator.decorate(() => {
       const cubeBone = bone();
       cubeBone.point('base').stickTo(root);
       cubeBone.scale({x: 0.5, y: 1, z: 0.5});
       cubeBone.createPoint('cubeAnchor', {x: 0, y: 0.5, z: 0});
       cubeBone.point('cubeAnchor').attachModel(cube);
    
        [0, 0.5, 1, 1.5].forEach((angleMultiplier) => {
           const towerBone = bone();
           towerBone.point('base').stickTo(root);
           towerBone.hold(towerBone.point('tip')).rotate(angleMultiplier * 180).release();
           towerBone.scale(0.15);
           towerBone.createPoint('towerAnchor', {x: 0, y: 0, z: 0.25});
           towerBone.point('towerAnchor').attachModel(pointed);
        });
    });
    
    const nextTower = bone();
    nextTower.point('base').stickTo(root);
    nextTower.scale({x: 0.8, y: 0.95, z: 0.8});
    Generator.addDetail({ component: 'tower', at: nextTower.point('tip') });
})
.wrapUpMany(['base', 'block'], () => {})
.wrapUp('roofOrTower', Generator.replaceWith('roof'))
.thenComplete(['facade', 'roof']);
