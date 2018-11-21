import * as calder from 'calder-gl';
import * as lodash from 'lodash';

import { onFreshState, state } from './state';

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

const logElement = <HTMLDivElement> document.getElementById('log');
const runBtn = <HTMLButtonElement> document.getElementById('run');
const exportBtn = <HTMLButtonElement> document.getElementById('export');

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
onFreshState(() => {
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
    if (event.key == 'r' && event.ctrlKey) {
        runBtn.click();
        event.stopPropagation();
        return false;
    }
    return true;
});


const webglElement = <HTMLDivElement> document.getElementById('webgl');
webglElement.appendChild(renderer.stage);

setupOnscreenInteractions();


// OBJ export
exportBtn.addEventListener('click', () => {
    if (!state.model) {
        return;
    }

    const obj = state.model.exportOBJ('calderExport', ambientLightColor);

    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);

    // Download obj
    link.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(obj.obj)}`);
    link.setAttribute('download', 'calderExport.obj');
    link.click();

    // Download mtl
    link.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(obj.mtl)}`);
    link.setAttribute('download', 'calderExport.mtl');
    link.click();

    document.body.removeChild(link);
});
