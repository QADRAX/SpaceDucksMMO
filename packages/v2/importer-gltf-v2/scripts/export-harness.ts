import fs from 'node:fs';
import path from 'node:path';
import { parseGLBToECS } from '../src';
import type { ImportedEntityData } from '../src/domain/types';

const GLB_FILE_NAME = 'astra_lumen_ii_a_rigged_companion_android';
const GLB_FILE_PATH = path.join(__dirname, `../data/${GLB_FILE_NAME}.glb`);
const HARNESS_DIR = path.join(__dirname, '../../engine-test-harness/public');

// Minimal YAML standardizer specific to engine-test-harness
function dumpEntitiesToYaml(entities: ImportedEntityData[]): string {
    let yaml = 'entities:\n';
    
    // Inject default camera and lights for viewing
    yaml += `  - id: "engine-camera"
    transform:
      position: { x: 0, y: 1, z: 4 }
    components:
      cameraPerspective: { fov: 60 }\n
  - id: "engine-dir-light"
    transform:
      position: { x: 5, y: 10, z: 5 }
    components:
      directionalLight: { intensity: 1.5 }\n
  - id: "engine-amb-light"
    components:
      ambientLight: { intensity: 0.5 }\n\n`;
    
    for (const ent of entities) {
        yaml += `  - id: "${ent.name}"\n`;
        if (ent.parentId) {
            yaml += `    parentId: "${ent.parentId}"\n`;
        }
        
        yaml += `    transform:\n`;
        if (ent.translation) yaml += `      position: { x: ${ent.translation[0]}, y: ${ent.translation[1]}, z: ${ent.translation[2]} }\n`;
        if (ent.rotation) yaml += `      rotation: { x: ${ent.rotation[0]}, y: ${ent.rotation[1]}, z: ${ent.rotation[2]}, w: ${ent.rotation[3]} }\n`;
        if (ent.scale) yaml += `      scale: { x: ${ent.scale[0]}, y: ${ent.scale[1]}, z: ${ent.scale[2]} }\n`;
        
        if (ent.components && ent.components.length > 0) {
            yaml += `    components:\n`;
            for (const comp of ent.components) {
                yaml += `      ${comp.type}:\n`;
                for (const [k, v] of Object.entries(comp)) {
                    if (k === 'type') continue; // Skip the discriminator
                    
                    if (v && typeof v === 'object' && 'key' in v && 'kind' in v) {
                        // It's a ResourceRef
                        let folderName = `${v.kind}s`;
                        if (v.kind === 'standardMaterial') folderName = 'materials';
                        if (v.kind === 'animationClip') folderName = 'animations';
                        yaml += `        ${k}: "${folderName}/${v.key}"\n`;
                    } else if (k === 'clips' && Array.isArray(v)) {
                         yaml += `        ${k}:\n`;
                         for (const clipRef of v) {
                             yaml += `          - "animations/${clipRef.key}"\n`;
                         }
                    } else if (k === 'rigRootEntityId') {
                        // It's an EntityId
                        yaml += `        ${k}: "${v}"\n`;
                    } else {
                        yaml += `        ${k}: ${JSON.stringify(v)}\n`;
                    }
                }
            }
        }
        yaml += '\n';
    }
    
    return yaml;
}

async function main() {
    console.log(`Reading GLB from: ${GLB_FILE_PATH}`);
    const buffer = fs.readFileSync(GLB_FILE_PATH);
    const uint8Array = new Uint8Array(buffer);

    console.log(`Parsing GLB...`);
    const result = await parseGLBToECS(uint8Array);

    console.log(`Exporting to Harness Format at: ${HARNESS_DIR}`);
    
    // Write Textures
    Object.entries(result.textures).forEach(([key, texData]) => {
        let ext = 'png';
        if (texData.mimeType.includes('jpeg') || texData.mimeType.includes('jpg')) ext = 'jpg';
        if (texData.mimeType.includes('webp')) ext = 'webp';
        
        const safeName = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const rDir = path.join(HARNESS_DIR, 'textures', safeName);
        fs.mkdirSync(rDir, { recursive: true });
        
        fs.writeFileSync(path.join(rDir, `image.${ext}`), texData.buffer);
        fs.writeFileSync(path.join(rDir, 'resource.json'), JSON.stringify({
            componentType: "texture",
            componentData: {},
            files: {
                image: { url: `image.${ext}` }
            }
        }, null, 2));
    });

    // Write Meshes
    Object.entries(result.meshes).forEach(([key, meshData]) => {
        const rDir = path.join(HARNESS_DIR, 'meshes', key);
        fs.mkdirSync(rDir, { recursive: true });
        
        fs.writeFileSync(path.join(rDir, `geometry.json`), JSON.stringify(meshData));
        fs.writeFileSync(path.join(rDir, 'resource.json'), JSON.stringify({
            componentType: "mesh",
            componentData: {},
            files: {
                geometry: { url: "geometry.json" }
            }
        }, null, 2));
    });

    // Write Animations
    Object.entries(result.animations).forEach(([key, animData]) => {
        const rDir = path.join(HARNESS_DIR, 'animations', key);
        fs.mkdirSync(rDir, { recursive: true });
        
        fs.writeFileSync(path.join(rDir, `clip.json`), JSON.stringify(animData));
        fs.writeFileSync(path.join(rDir, 'resource.json'), JSON.stringify({
            componentType: "animationClip",
            componentData: {},
            files: {
                clip: { url: "clip.json" }
            }
        }, null, 2));
    });

    // Write Materials
    Object.entries(result.materials).forEach(([key, matData]) => {
        const rDir = path.join(HARNESS_DIR, 'materials', key);
        fs.mkdirSync(rDir, { recursive: true });
        
        const componentData = { ...matData };
        // We could extract the texture references to the files slot, 
        // but core-v2 might allow passing the string references directly into componentData
        // if they match ResourceRef syntax!
        // The material parser usually turns strings like `textures/foo` into ResourceRefs
        
        fs.writeFileSync(path.join(rDir, 'resource.json'), JSON.stringify({
            componentType: "standardMaterial",
            componentData,
            files: {} 
        }, null, 2));
    });

    // Write Scene YAML
    const sceneYaml = dumpEntitiesToYaml(result.entities);
    const scenesDir = path.join(HARNESS_DIR, 'scenes');
    if (!fs.existsSync(scenesDir)) fs.mkdirSync(scenesDir, { recursive: true });
    
    fs.writeFileSync(path.join(scenesDir, `${GLB_FILE_NAME}.yaml`), sceneYaml);

    console.log(`\nSuccessfully populated engine-test-harness/public!`);
}

main().catch(console.error);
