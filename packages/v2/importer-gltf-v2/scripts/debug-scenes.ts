import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';

const GLB_FILE_PATH = path.join(__dirname, `../data/astra_lumen_ii_a_rigged_companion_android.glb`);

async function main() {
    const io = new NodeIO();
    const document = await io.read(GLB_FILE_PATH);

    const root = document.getRoot();
    
    console.log(`Total Scenes: ${root.listScenes().length}`);
    for(const scene of root.listScenes()) {
        console.log(`Scene ${scene.getName()} has roots: ${scene.listChildren().map(c => c.getName())}`);
    }

    const object7 = root.listNodes().find(n => n.getName() === 'Object_7');
    if (object7) {
        console.log(`Object_7 exists.`);
        const parents = object7.listParents();
        console.log(`Parents length: ${parents.length}`);
        
        for (const p of parents) {
            console.log(`- Parent property type: ${p.propertyType}`);
            // Check if it's a scene
            if (p.propertyType === 'Scene') {
                console.log(` ---> Scene Name: ${(p as any).getName()}`);
            } else if (p.propertyType === 'Node') {
                console.log(` ---> Node Name: ${(p as any).getName()}`);
            }
        }
    }
}

main().catch(console.error);
