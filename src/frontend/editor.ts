import * as ace from 'brace';
import 'brace/mode/javascript';
import 'brace/ext/language_tools';

import { Completion } from './Completion';
import { onChange, state } from './state';

const codeElement = <HTMLScriptElement>document.getElementById('code');
export const editor = ace.edit('source');
editor.getSession().setValue(codeElement.innerText);
editor.getSession().setMode('ace/mode/javascript');
ace.acequire('ace/ext/language_tools').addCompleter(new Completion());
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true
});

onChange('source', () => editor.getSession().setValue(state.source || codeElement.innerText));
