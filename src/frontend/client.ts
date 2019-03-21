import * as calder from 'calder-gl';
import * as lodash from 'lodash';

import { currentState } from './state';
import { BakedState } from './serializable_models/state';

import { addCostFn, addCostFunctionViz } from './costFn';
import { addGenerator } from './generator';
import { addModel } from './model';
import { ambientLightColor, renderer } from './renderer';
import { setupOnscreenInteractions } from './interactions';
import { initializeLocalStorage } from './localstorage';
import { ObjLoader } from './loader';

// Add globals for use in user code

for (const key in calder) {
    (<any>window)[key] = calder[key];
}

for (const key in lodash) {
    (<any>window)[key] = lodash[key];
}

(<any>window)['loadObj'] = ObjLoader.loadObj;

const logElement = <HTMLDivElement>document.getElementById('log');
const runBtn = <HTMLButtonElement>document.getElementById('run');
const exportBtn = <HTMLButtonElement>document.getElementById('export');

const oldLog = console.log;
console.log = function() {
    logElement.innerText = Array.prototype.map.call(arguments, (a: any) => `${a}`).join(', ') + '\n' + logElement.innerText;
    oldLog.apply(console, arguments);
};

window.onerror = (e: Event, _source: string, _fileno: number, _colno: number) => {
    console.log(e);
};

window.onbeforeunload = () => {
    return 'Are you sure you want to leave?';
};

// Set initial state
currentState.onFreshState(() => {
    ObjLoader.clearModelCache();
    initializeLocalStorage();
    addCostFn();
    addCostFunctionViz();
    addGenerator();
    addModel();
});

// Add UI hooks
runBtn.addEventListener('click', () => {
    addCostFn();
    addGenerator();
    addModel();
});

window.addEventListener('keyup', (event: KeyboardEvent) => {
    if (event.key == 'r' && (event.ctrlKey || event.altKey)) {
        runBtn.click();
        event.stopPropagation();
        return false;
    }
    return true;
});

const webglElement = <HTMLDivElement>document.getElementById('webgl');
webglElement.appendChild(renderer.stage);

setupOnscreenInteractions();

// OBJ export
exportBtn.addEventListener('click', () => {
    const currentBakedState: BakedState = currentState.getUnderlyingObject();

    if (!currentBakedState.model) {
        return;
    }

    const obj = currentBakedState.model.exportOBJ('calderExport', ambientLightColor);

    const objLink = document.createElement('a');
    objLink.style.display = 'none';
    document.body.appendChild(objLink);

    // Download obj
    const objBlob = new Blob([obj.obj], { type: 'text/plain;charset=utf-8' });
    objLink.setAttribute('href', URL.createObjectURL(objBlob));
    objLink.setAttribute('download', 'calderExport.obj');
    objLink.click();

    const mtlLink = document.createElement('a');
    mtlLink.style.display = 'none';
    document.body.appendChild(mtlLink);

    // Download mtl
    const mtlBlob = new Blob([obj.mtl], { type: 'text/plain;charset=utf-8' });
    mtlLink.setAttribute('href', URL.createObjectURL(mtlBlob));
    mtlLink.setAttribute('download', 'calderExport.mtl');
    mtlLink.click();

    document.body.removeChild(objLink);
    document.body.removeChild(mtlLink);
});
