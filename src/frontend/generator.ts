import * as calder from 'calder-gl';
import { transform } from '@babel/standalone';

import { state } from './state';
import { editor } from './editor';
import { renderer } from './renderer';

export const addGenerator = () => {
    const source = editor.getSession().getValue();

    if (source === state.source && state.generator) {
        return;
    }

    const { code } = transform(source, { sourceType: 'script' });

    const setup = new Function('generator', code);

    renderer.cleanBakedGeometryBuffers();

    try {
        const generator = calder.Armature.generator();
        setup(generator);

        state.setState({ source, generator });
    } catch (e) {
        console.log(e);

        state.setState({ source, generator: undefined });
    }
};
