import * as calder from 'calder-gl';
const randomSeed = require('random-seed');
import { range } from 'lodash';

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

const shuffleBtn = <HTMLButtonElement> document.getElementById('shuffle');
const form = <HTMLFormElement> document.getElementById('state');
const seedElements = range(4).map((i) => <HTMLInputElement> document.getElementById(`seed${i}`));
const focusedElement = <HTMLInputElement> document.getElementById('focused');

const oldLog = console.log;
console.log = function() {
    logElement.innerText += Array.prototype.map.call(arguments, (a: any) => `${a}`).join(', ') + '\n';
    oldLog.apply(console, arguments);
};

window.onerror = (e: Event, _source: string, _fileno: number, _colno: number) => {
    console.log(e);
};

const code = codeElement.innerText;

const setup = new Function('renderer', code);

const oldRandom = Math.random;
const render = (seed, size, handler) => {
    const generator = randomSeed.create();
    generator.seed(seed);
    Math.random = () => generator.random();

    const renderer = new calder.Renderer(size, size, 10);
    setup(renderer);

    webglElement.appendChild(renderer.stage);
    renderer.stage.addEventListener('click', handler);
};

const seeds = seedElements.map((e) => parseFloat(e.value));
const focused = parseInt(focusedElement.value);
if (focused >= 0 && focused < 4) {
    render(seeds[focused], 400, () => {
        focusedElement.value = '-1';
        form.submit();
    });
} else {
    seeds.forEach((seed, i) => render(seed, 150, () => {
        focusedElement.value = `${i}`;
        form.submit();
    }));
}

shuffleBtn.addEventListener('click', () => {
    seedElements.map((e) => e.value = oldRandom() * 10000);
    form.submit();
});
