import * as calder from 'calder-gl';

for (const key in calder) {
    (<any>window)[key] = calder[key];
}

const logElement = document.getElementById('log');
if (logElement === null) {
    throw new Error('Could not find log element');
}

const codeElement = document.getElementById('code');
if (codeElement === null) {
    throw new Error('Could not find source code element');
}

const webglElement = document.getElementById('webgl');
if (webglElement === null) {
    throw new Error('Could not find webgl element');
}

const oldLog = console.log;
console.log = function() {
    logElement.innerText += Array.prototype.map.call(arguments, (a: any) => `${a}`).join(', ');
    oldLog.apply(console, arguments);
};

window.onerror = (e: Event, _source: string, _fileno: number, _colno: number) => {
    console.log(e);
};

const code = codeElement.innerText;

const setup = new Function('renderer', code);

const renderer = new calder.Renderer(800, 600, 10);
setup(renderer);

webglElement.appendChild(renderer.stage);
