const fs = require('fs');
const path = require('path');

const builtinDir = path.join(__dirname, '../res/scripts/builtin');
const targetDir = path.join(__dirname, '../src/domain/scripting/generated');
const targetFile = path.join(targetDir, 'EditorScriptAssets.ts');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

let output = `// Auto-generated file. Do not edit directly.\n`;
output += `// Run 'npm run build:scripts' to regenerate.\n\n`;

// 1. Generate ViewportControllers (Main logic for viewports)
const controllerDir = path.join(builtinDir, 'viewport');
const controllerFiles = fs.existsSync(controllerDir) ? fs.readdirSync(controllerDir).filter((f: string) => f.endsWith('.lua')) : [];
output += `export const ViewportControllers: Record<string, string> = {\n`;
for (const file of controllerFiles) {
    const raw = fs.readFileSync(path.join(controllerDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "editor-builtin://controller/${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 2. Generate ViewportFeatures (Modular UI & logic features)
const featuresDir = path.join(builtinDir, 'plugins');
const featureFiles = fs.existsSync(featuresDir) ? fs.readdirSync(featuresDir).filter((f: string) => f.endsWith('.lua')) : [];
output += `export const ViewportFeatures: Record<string, string> = {\n`;
for (const file of featureFiles) {
    const raw = fs.readFileSync(path.join(featuresDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "editor-builtin://feature/${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 3. Generate EditorSystemScripts
const systemDir = path.join(__dirname, '../res/scripts/system');
const systemFiles = fs.existsSync(systemDir) ? fs.readdirSync(systemDir).filter((f: string) => f.endsWith('.lua')) : [];
output += `export const EditorSystemScripts: Record<string, string> = {\n`;
for (const file of systemFiles) {
    const raw = fs.readFileSync(path.join(systemDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 4. Generate EditorTypes (.d.lua files for IDE/Documentation)
const typesDir = path.join(__dirname, '../res/scripts/types');
const typeFiles = fs.existsSync(typesDir) ? fs.readdirSync(typesDir).filter((f: string) => f.endsWith('.d.lua')) : [];
output += `export const EditorTypes: Record<string, string> = {\n`;
for (const file of typeFiles) {
    const raw = fs.readFileSync(path.join(typesDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

fs.writeFileSync(targetFile, output);
console.log(`Generated EditorScriptAssets.ts with ${controllerFiles.length} controllers, ${featureFiles.length} features, ${systemFiles.length} system scripts, and ${typeFiles.length} type definitions.`);
