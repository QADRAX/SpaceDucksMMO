import fs from 'node:fs';
import path from 'node:path';
import { parseGLBToECS } from '../src';

const GLB_FILE_PATH = path.join(__dirname, `../data/astra_lumen_ii_a_rigged_companion_android.glb`);

async function main() {
    const buffer = fs.readFileSync(GLB_FILE_PATH);
    const uint8Array = new Uint8Array(buffer);
    const result = await parseGLBToECS(uint8Array);

    const object7 = result.entities.find(e => e.name === 'Object_7');
    console.log('Found Object_7?', !!object7);
    if (object7) {
        console.log(JSON.stringify(object7, null, 2));
    } else {
        console.log('Names in entities:');
        console.log(result.entities.map(e => e.name).join(', '));
    }
}

main().catch(console.error);
