import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsUnlit } from '@gltf-transform/extensions';
import { KHRMaterialsClearcoat } from '@gltf-transform/extensions';

const GLB_FILE_PATH = path.join(__dirname, `../data/astra_lumen_ii_a_rigged_companion_android.glb`);

async function main() {
    const io = new NodeIO();
    io.registerExtensions([KHRMaterialsUnlit, KHRMaterialsClearcoat]);
    const document = await io.read(GLB_FILE_PATH);

    const root = document.getRoot();
    
    // Find who owns the mesh
    for (const node of root.listNodes()) {
        const mesh = node.getMesh();
        if (mesh) {
            console.log(`\n!!! FOUND MESH !!!`);
            console.log(`Node Name: "${node.getName()}"`);
            console.log(`Mesh Name: "${mesh.getName()}"`);
            console.log(`Has Skin?: ${!!node.getSkin()}`);
        }
    }
}

main().catch(console.error);
