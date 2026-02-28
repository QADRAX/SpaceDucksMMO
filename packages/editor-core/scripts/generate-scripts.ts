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

// 1. Generate EditorViewportScripts (Main logic for viewports)
const viewportDir = path.join(builtinDir, 'viewport');
const viewportFiles = fs.existsSync(viewportDir) ? fs.readdirSync(viewportDir).filter((f: string) => f.endsWith('.lua')) : [];
output += `export const EditorViewportScripts: Record<string, string> = {\n`;
for (const file of viewportFiles) {
    const raw = fs.readFileSync(path.join(viewportDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "editor-builtin://viewport/${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 2. Generate EditorViewportPlugins (UI & logic plugins)
const pluginsDir = path.join(builtinDir, 'plugins');
const pluginFiles = fs.existsSync(pluginsDir) ? fs.readdirSync(pluginsDir).filter((f: string) => f.endsWith('.lua')) : [];
output += `export const EditorViewportPlugins: Record<string, string> = {\n`;
for (const file of pluginFiles) {
    const raw = fs.readFileSync(path.join(pluginsDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "editor-builtin://plugins/${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 2. Generate EditorSystemScripts
const systemDir = path.join(__dirname, '../res/scripts/system');
const systemFiles = fs.existsSync(systemDir) ? fs.readdirSync(systemDir).filter((f: string) => f.endsWith('.lua')) : [];
output += `export const EditorSystemScripts: Record<string, string> = {\n`;
for (const file of systemFiles) {
    const raw = fs.readFileSync(path.join(systemDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 3. Generate EditorTypes (.d.lua files for IDE/Documentation)
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
console.log(`Generated EditorScriptAssets.ts with ${viewportFiles.length + pluginFiles.length} builtin, ${systemFiles.length} system scripts, and ${typeFiles.length} type definitions.`);
