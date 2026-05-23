import fs from 'node:fs';
import path from 'node:path';
import { parseGLBToECS } from '../src';

const GLB_FILE_NAME = 'astra_lumen_ii_a_rigged_companion_android';
const GLB_FILE_PATH = path.join(__dirname, `../data/${GLB_FILE_NAME}.glb`);
const OUT_DIR = path.join(__dirname, `../data/output/${GLB_FILE_NAME}`);

async function main() {
    console.log(`Reading GLB from: ${GLB_FILE_PATH}`);
    
    if (!fs.existsSync(GLB_FILE_PATH)) {
        console.error('File not found!');
        process.exit(1);
    }

    const buffer = fs.readFileSync(GLB_FILE_PATH);
    const uint8Array = new Uint8Array(buffer);

    console.log(`Parsing ${uint8Array.byteLength} bytes...`);
    const result = await parseGLBToECS(uint8Array);

    console.log(`Parse success! Found:`);
    console.log(`- Entities: ${result.entities.length}`);
    console.log(`- Meshes: ${Object.keys(result.meshes).length}`);
    console.log(`- Animations: ${Object.keys(result.animations).length}`);
    console.log(`- Materials: ${Object.keys(result.materials).length}`);
    console.log(`- Textures: ${Object.keys(result.textures).length}`);

    // Create output dir
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    console.log(`\nWriting JSON dumps to ${OUT_DIR}...`);
    
    // We stringify the objects, but to prevent massive JSON files from huge float arrays (like meshes),
    // we can use a replacer or just let it dump if it's manageable. 
    // Since it's a test dump, we'll write the full JSON.
    fs.writeFileSync(path.join(OUT_DIR, 'entities.json'), JSON.stringify(result.entities, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'materials.json'), JSON.stringify(result.materials, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'animations.json'), JSON.stringify(result.animations, null, 2));
    console.log(` -> Wrote entities, materials, and animations JSONs.`);

    // Escribimos el meshes.json COMPLETO para que engine-test-harness lo pueda consumir (buffers reales)
    console.log(`Writing full meshes JSON (this might be large)...`);
    fs.writeFileSync(path.join(OUT_DIR, 'meshes.json'), JSON.stringify(result.meshes));

    // For meshes, we also output a slim version to inspect in VS Code without crashing it
    const slimMeshes = Object.fromEntries(
        Object.entries(result.meshes).map(([k, v]) => [
            k, 
            {
                positionsLength: v.positions.length,
                indicesLength: v.indices.length,
                normalsLength: v.normals?.length,
                uvsLength: v.uvs?.length,
                jointIndicesLength: v.jointIndices?.length,
                jointWeightsLength: v.jointWeights?.length,
                // Taking just the first 10 elements to preview
                positionsPreview: v.positions.slice(0, 10),
                jointIndicesPreview: v.jointIndices?.slice(0, 10),
                jointWeightsPreview: v.jointWeights?.slice(0, 10),
            }
        ])
    );
    fs.writeFileSync(path.join(OUT_DIR, 'meshes_structure.json'), JSON.stringify(slimMeshes, null, 2));
    console.log(` -> Wrote slim meshes preview.`);

    console.log(`Writing Textures to disk...`);
    Object.entries(result.textures).forEach(([key, texData]) => {
        // Find extension from mimetype
        let ext = '.png';
        if (texData.mimeType.includes('jpeg') || texData.mimeType.includes('jpg')) ext = '.jpg';
        if (texData.mimeType.includes('webp')) ext = '.webp';
        
        // Strip out bad characters for filesystem
        const safeName = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const texPath = path.join(OUT_DIR, `${safeName}${ext}`);
        
        fs.writeFileSync(texPath, texData.buffer);
        console.log(` -> Wrote Texture: ${texPath} (${texData.buffer.byteLength} bytes)`);
    });

    console.log(`\nAll done! Check the output directory.`);
}

main().catch(console.error);
