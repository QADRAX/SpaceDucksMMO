import type { Document } from '@gltf-transform/core';
import type { StandardMaterialData } from '@duckengine/core-v2';

// Import the specific extension types to read metadata instead of faking it
import type { 
    Clearcoat, 
    IOR, 
    Iridescence, 
    Sheen, 
    Transmission, 
    Volume 
} from '@gltf-transform/extensions';

export function extractMaterials(document: Document): Record<string, StandardMaterialData> {
    const materials: Record<string, StandardMaterialData> = {};
    
    for (const material of document.getRoot().listMaterials()) {
        const color = material.getBaseColorFactor();
        
        // Grab Extensions
        const iorExt = material.getExtension('KHR_materials_ior') as IOR | null;
        const transmissionExt = material.getExtension('KHR_materials_transmission') as Transmission | null;
        const volumeExt = material.getExtension('KHR_materials_volume') as Volume | null;
        const clearcoatExt = material.getExtension('KHR_materials_clearcoat') as Clearcoat | null;
        const sheenExt = material.getExtension('KHR_materials_sheen') as Sheen | null;
        const iridescenceExt = material.getExtension('KHR_materials_iridescence') as Iridescence | null;

        // Properly map to hex string #RRGGBB
        const r = Math.floor(color[0] * 255).toString(16).padStart(2, '0');
        const g = Math.floor(color[1] * 255).toString(16).padStart(2, '0');
        const b = Math.floor(color[2] * 255).toString(16).padStart(2, '0');
        const hexColor = `#${r}${g}${b}`;
        
        // Parse emissive similarly
        const eColor = material.getEmissiveFactor();
        const er = Math.floor(eColor[0] * 255).toString(16).padStart(2, '0');
        const eg = Math.floor(eColor[1] * 255).toString(16).padStart(2, '0');
        const eb = Math.floor(eColor[2] * 255).toString(16).padStart(2, '0');
        const hexEmissive = `#${er}${eg}${eb}`;

        // Get sheen color if extension exists
        const sheenColor = sheenExt ? sheenExt.getSheenColorFactor() : [0,0,0];
        const sr = Math.floor(sheenColor[0] * 255).toString(16).padStart(2, '0');
        const sg = Math.floor(sheenColor[1] * 255).toString(16).padStart(2, '0');
        const sb = Math.floor(sheenColor[2] * 255).toString(16).padStart(2, '0');
        
        // Get attenuation color from volume extension
        const attenColor = volumeExt ? volumeExt.getAttenuationColor() : [1,1,1];
        const ar = Math.floor(attenColor[0] * 255).toString(16).padStart(2, '0');
        const ag = Math.floor(attenColor[1] * 255).toString(16).padStart(2, '0');
        const ab = Math.floor(attenColor[2] * 255).toString(16).padStart(2, '0');

        const materialId = material.getName() || `material_${Object.keys(materials).length}`;

        materials[materialId] = {
            color: hexColor,
            metalness: material.getMetallicFactor(),
            roughness: material.getRoughnessFactor(),
            emissive: hexEmissive,
            emissiveIntensity: 1, // Assume 1, glTF v2 applies scalar directly via factor
            transparent: material.getAlphaMode() !== 'OPAQUE',
            opacity: color[3], // Base color alpha is opacity
            alphaMode: material.getAlphaMode() === 'BLEND' ? 'blend' : (material.getAlphaMode() === 'MASK' ? 'mask' : 'opaque'),
            alphaCutoff: material.getAlphaCutoff(),
            doubleSided: material.getDoubleSided(),
            normalScale: material.getNormalScale(),
            
            // Precision mapping via Extensions
            ior: iorExt ? iorExt.getIOR() : 1.5,
            transmission: transmissionExt ? transmissionExt.getTransmissionFactor() : 0,
            thickness: volumeExt ? volumeExt.getThicknessFactor() : 0,
            attenuationColor: `#${ar}${ag}${ab}`,
            attenuationDistance: volumeExt ? volumeExt.getAttenuationDistance() : Infinity,
            clearcoat: clearcoatExt ? clearcoatExt.getClearcoatFactor() : 0,
            clearcoatRoughness: clearcoatExt ? clearcoatExt.getClearcoatRoughnessFactor() : 0,
            clearcoatNormalScale: 1, // Clearcoat normal missing in TS bindings directly sometimes, defaulting to 1
            sheen: sheenExt ? 1 : 0,
            sheenRoughness: sheenExt ? sheenExt.getSheenRoughnessFactor() : 0,
            sheenColor: `#${sr}${sg}${sb}`,
            iridescence: iridescenceExt ? iridescenceExt.getIridescenceFactor() : 0,
            iridescenceIOR: iridescenceExt ? iridescenceExt.getIridescenceIOR() : 1.3,
            iridescenceThicknessRange: iridescenceExt 
                ? [iridescenceExt.getIridescenceThicknessMinimum(), iridescenceExt.getIridescenceThicknessMaximum()] 
                : [100, 400]
        };
    }

    return materials;
}
