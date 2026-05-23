import type { Document } from '@gltf-transform/core';
import type { ImportedTextureData } from '../../domain/types';

export function extractTextures(document: Document): Record<string, ImportedTextureData> {
    const textures: Record<string, ImportedTextureData> = {};
    for (const texture of document.getRoot().listTextures()) {
        const imgImage = texture.getImage();
        const mimeType = texture.getMimeType() || 'image/png';
        const name = texture.getName() || `texture_${Object.keys(textures).length}`;
        
        if (imgImage) {
            textures[name] = { name, mimeType, buffer: imgImage };
        }
    }
    return textures;
}
