import * as calder from 'calder-gl';
import { transform } from '@babel/standalone';

import { setState, state } from './state';
import { editor } from './editor';

export const addGenerator = () => {
    const source = editor.getSession().getValue();

    if (source === state.source) {
        return;
    }

    const { code } = transform(source, { sourceType: 'script' });

    const setup = new Function('generator', code);

    try {
        const generator = calder.Armature.generator();
        setup(generator);

        setState({ source, generator });
    } catch (e) {
        console.log(e);

        setState({ source, generator: undefined });
    }
};
