import * as calder from 'calder-gl';
import { transform } from '@babel/standalone';

import { setState, state } from './state';
import { editor } from './editor';
import { renderer } from './renderer';
import { StillLoadingObj } from './loader';

export const addGenerator = () => {
    const source = editor.getSession().getValue();

    if (!source || (source === state.source && state.generator)) {
        return;
    }

    setState({ source });

    const { code } = transform(source, { sourceType: 'script' });

    const setup = new Function('generator', code);

    renderer.cleanBakedGeometryBuffers();

    try {
        const generator = calder.Armature.generator();
        setup(generator);

        setState({ generator });
    } catch (e) {
        if (e instanceof StillLoadingObj) {
            // Wait for models to load, we will automatically rerun when they are done
        } else {
            console.log(e);

            setState({ generator: undefined });
        }
    }
};
