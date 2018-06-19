import * as calder from 'calder-gl';
import { Completion } from './Completion';
const randomSeed = require('random-seed');
import { range } from 'lodash';
import { transform } from '@babel/standalone';
import * as ace from 'brace';
import 'brace/mode/javascript';
import 'brace/ext/language_tools';

for (const key in calder) {
    (<any>window)[key] = calder[key];
}

const logElement = <HTMLDivElement> document.getElementById('log');
const codeElement = <HTMLScriptElement> document.getElementById('code');
const webglElement = <HTMLDivElement> document.getElementById('webgl');
const shuffleBtn = <HTMLButtonElement> document.getElementById('shuffle');
const runBtn = <HTMLButtonElement> document.getElementById('run');

const oldLog = console.log;
console.log = function() {
    logElement.innerText += Array.prototype.map.call(arguments, (a: any) => `${a}`).join(', ') + '\n';
    oldLog.apply(console, arguments);
};

window.onerror = (e: Event, _source: string, _fileno: number, _colno: number) => {
    console.log(e);
};


const editor = ace.edit('source');
editor.getSession().setValue(codeElement.innerText);
editor.getSession().setMode('ace/mode/javascript');
ace.acequire('ace/ext/language_tools').addCompleter(new Completion());
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true
});

const state: {
    render: (seed: number, size: number, handler: () => void) => void;
    seeds: number[];
    focused: number | null;
    updateRenderView: () => void;
    renderer: calder.Renderer | null;
} = {
    render: (_seed, _size, _handler) => {},
    seeds: range(4).map(() => Math.random() * 10000),
    focused: 0,
    updateRenderView: () => {

        const oldRandom = Math.random;

        while (webglElement.firstChild) {
            webglElement.removeChild(webglElement.firstChild);
        }

        if (state.focused === null) {
            state.seeds.forEach((seed, i) => state.render(seed, 150, () => {
                state.focused = i;
                state.updateRenderView();
            }));
        } else {
            state.render(state.seeds[state.focused], 400, () => {
                state.focused = null;
                state.updateRenderView();
            });
        }

        Math.random = oldRandom;
    },
    renderer: null
};

shuffleBtn.addEventListener('click', () => {
    state.seeds = range(4).map(() => Math.random() * 10000);
    state.updateRenderView();
});

runBtn.addEventListener('click', () => {
    try {
        const source = editor.getSession().getValue();
        const { code } = transform(source, { sourceType: 'script' });

        const setup = new Function('renderer', code);

        state.render = (seed, size, handler) => {
            const generator = randomSeed.create();
            generator.seed(seed);
            Math.random = () => generator.random();

            if (state.renderer) {
                state.renderer.destroy();
            }
            state.renderer = new calder.Renderer({
                width: size,
                height: size,
                maxLights: 10,
                ambientLightColor: calder.RGBColor.fromHex('#333333')
            });
            setup(state.renderer);

            webglElement.appendChild(state.renderer.stage);
            state.renderer.stage.addEventListener('click', handler);
        };

        state.updateRenderView();

    } catch (e) {
        console.log(e);
    }
});
runBtn.click();

window.addEventListener('keyup', (event: KeyboardEvent) => {
    if (event.key == 'r' && event.ctrlKey) {
        runBtn.click();
        event.stopPropagation();
        return false;
    }
    return true;
});
