import { GeometryNode, Material, Model, Node } from 'calder-gl';

import { addCostFn } from './costFn';
import { addGenerator } from './generator';
import { addModel } from './model';

const modelCache: { [name: string]: Model } = {};

export function clearModelCache() {
    for (const key in modelCache) {
        delete modelCache[key];
    }
}

export class StillLoadingObj extends Error {}

export function loadObj(objName: string, mtlName: string, overrideMaterial?: Material): Model {
    if (!modelCache[objName]) {
        modelCache[objName] = Model.create(new Node());

        Promise.all([
            fetch(`/models/${objName}.obj`),
            fetch(`/models/${mtlName}.mtl`)
        ]).then((responses) => {;
            return Promise.all(responses.map((response) => response.text()));
        }).then(([objData, mtlData]) => {
            const model = Model.importObj(objData, mtlData);
            if (overrideMaterial) {
                const bakedMaterial = overrideMaterial.bake();
                model.nodes.forEach((n: Node) => n.geometryCallback((node: GeometryNode) => {
                    node.bakedGeometry.bakedMaterial = bakedMaterial;
                }));
            }
            modelCache[objName] = model;

            addCostFn();
            addGenerator();
            addModel();
        });

        throw new StillLoadingObj();
    }

    return modelCache[objName];
}
