import { GeometryNode, Material, Model, Node } from 'calder-gl';

import { addCostFn } from './costFn';
import { addGenerator } from './generator';
import { addModel } from './model';

const modelCache: { [name: string]: Model } = {};
const modelIsLoading: { [name: string]: true } = {};

export function clearModelCache() {
    for (const key in modelCache) {
        delete modelCache[key];
        delete modelIsLoading[key];
    }
}

// A subclass of Error that gets handled silently to indicate that render progress
// should stop due to a model still being loaded.
export class StillLoadingObj extends Error {}

export function loadObj(objName: string, mtlName: string, overrideMaterial?: Material): Model {
    // If we haven't loaded the model yet, asynchronously load and parse them
    if (!modelCache[objName]) {

        // Asynchronously load the obj and mtl data if we haven't started those
        // requests yet
        if (!modelIsLoading[objName]) {
            Promise.all([
                fetch(`/models/${objName}.obj`),
                fetch(`/models/${mtlName}.mtl`)
            ]).then((responses) => {;
                return Promise.all(responses.map((response) => response.text()));
            }).then(([objData, mtlData]) => {

                // Parse the data into a Model
                const model = Model.importObj(objData, mtlData);

                // Optionally replace all materials with our own
                if (overrideMaterial) {
                    const bakedMaterial = overrideMaterial.bake();
                    model.nodes.forEach((n: Node) => n.geometryCallback((node: GeometryNode) => {
                        node.geometry.bakedMaterial = bakedMaterial;
                    }));
                }

                modelCache[objName] = model;
                delete modelIsLoading[objName];

                // Trigger a rerender
                addCostFn();
                addGenerator();
                addModel();
            });

            modelIsLoading[objName] = true;
        }

        // Throw an error to prevent anything else from running on an incomplete model.
        throw new StillLoadingObj();
    }

    return modelCache[objName];
}
