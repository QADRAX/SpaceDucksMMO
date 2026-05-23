import { WebIO } from '@gltf-transform/core';
import { 
    KHRMaterialsClearcoat, 
    KHRMaterialsIOR, 
    KHRMaterialsIridescence, 
    KHRMaterialsSheen, 
    KHRMaterialsTransmission, 
    KHRMaterialsVolume 
} from '@gltf-transform/extensions';

import type { IGLTFParserPort } from '../application/ports';
import type { GLTFParsedResult } from '../domain/types';

import { extractTextures } from './extractors/textures';
import { extractMaterials } from './extractors/materials';
import { extractMeshes } from './extractors/meshes';
import { extractNodes } from './extractors/nodes';
import { extractAnimations } from './extractors/animations';

export function createGltfTransformParserAdapter(): IGLTFParserPort {
    const io = new WebIO().registerExtensions([
        KHRMaterialsClearcoat,
        KHRMaterialsIOR,
        KHRMaterialsIridescence,
        KHRMaterialsSheen,
        KHRMaterialsTransmission,
        KHRMaterialsVolume
    ]);

    return {
        async parseBuffer(buffer: Uint8Array): Promise<GLTFParsedResult> {
            const document = await io.readBinary(buffer);
            
            // Note: nodes extraction requires a pre-pass that mutates Node names. 
            // It MUST run before animations to guarantee consistent `targetEntityId`.
            const entities = extractNodes(document);

            return {
                textures: extractTextures(document),
                materials: extractMaterials(document),
                meshes: extractMeshes(document),
                entities,
                animations: extractAnimations(document),
            };
        }
    };
}
