import * as calder from 'calder-gl';

declare global {
    interface Window { calder: any; }
}

window.calder = calder;

const logElement = document.getElementById('log');
if (logElement === null) {
    throw new Error('Could not find log element');
}

const sourceElement = document.getElementById('source');
if (sourceElement === null) {
    throw new Error('Could not find source code element');
}

const oldLog = console.log;
console.log = function() {
    logElement.innerText += Array.prototype.map.call(arguments, (a: any) => `${a}`).join(', ');
    oldLog.apply(console, arguments);
};

window.onerror = function(e: Event, _source: string, _fileno: number, _colno: number) {
    console.log(e);
};

const source = sourceElement.innerText;


eval(source);
