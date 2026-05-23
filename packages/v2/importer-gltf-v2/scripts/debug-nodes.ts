import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';

const GLB_FILE_PATH = path.join(__dirname, `../data/astra_lumen_ii_a_rigged_companion_android.glb`);

async function main() {
    const io = new NodeIO();
    const document = await io.read(GLB_FILE_PATH);

    const root = document.getRoot();
    console.log(`Total Nodes: ${root.listNodes().length}`);
    console.log(`Total Meshes: ${root.listMeshes().length}`);
    
    // Find who owns the mesh
    for (const node of root.listNodes()) {
        const mesh = node.getMesh();
        if (mesh) {
            console.log(`Node "${node.getName() || 'unnamed'}" has a mesh!`);
            // Check its lineage
            let p = node.getParent();
            let isOrphan = false;
            while (p) {
                if (p.propertyType === 'Root') {
                    // It's attached directly to root but not a scene? No, root is Document.
                    console.log(`-> Reached Document Root. Was it in a Scene?`);
                    isOrphan = true;
                    break;
                }
                if (p.propertyType === 'Scene') {
                    console.log(`-> Reached Scene: ${p.getName() || 'unnamed'}`);
                    break;
                }
                p = p.getParent();
            }
            if (isOrphan) {
                console.log(`This node is NOT connected to any Scene!`);
            }
        }
    }
}

main().catch(console.error);
