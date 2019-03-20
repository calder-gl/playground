import * as calder from 'calder-gl';
import { transform } from '@babel/standalone';

import { currentState } from './state';
import { editor } from './editor';
import { renderer } from './renderer';
import { StillLoadingObj } from './loader';

export const addGenerator = () => {
    const { source, generator } = currentState.asBakedType();
    const editorSource = editor.getSession().getValue();

    if (!editorSource || (editorSource === source && generator)) {
        return;
    }

    currentState.setState({ source: editorSource });

    const { code } = transform(editorSource, { sourceType: 'script' });

    const setup = new Function('generator', code);

    renderer.cleanBakedGeometryBuffers();

    try {
        const newGenerator = calder.Armature.generator();
        setup(newGenerator);
        currentState.setState({ generator: newGenerator });
    } catch (e) {
        if (e instanceof StillLoadingObj) {
            // Wait for models to load, we will automatically rerun when they are done
        } else {
            console.log(e);
            currentState.setState({ generator: undefined });
        }
    }
};
