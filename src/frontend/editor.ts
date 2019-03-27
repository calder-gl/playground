import * as ace from 'brace';
import 'brace/mode/javascript';
import 'brace/ext/language_tools';

import { Completion } from './Completion';
import { onChange, currentState } from './state';

export const editor = ace.edit('source');
editor.getSession().setMode('ace/mode/javascript');
ace.acequire('ace/ext/language_tools').addCompleter(new Completion());
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true
});

onChange('source', () => {
    const { source } = currentState.getUnderlyingObject();
    if (editor.getSession().getValue() === source) {
        return;
    }
    editor.getSession().setValue(source || '');
});
