import * as fs from 'fs';
import * as path from 'path';

const builtinDir = path.join(__dirname, '../res/scripts/builtin');
const targetDir = path.join(__dirname, '../src/domain/scripting/generated');
const targetFile = path.join(targetDir, 'EditorScriptAssets.ts');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

let output = `// Auto-generated file. Do not edit directly.\n`;
output += `// Run 'npm run build:scripts' to regenerate.\n\n`;

// 1. Generate EditorBuiltinScripts
const builtinFiles = fs.existsSync(builtinDir) ? fs.readdirSync(builtinDir).filter(f => f.endsWith('.lua')) : [];
output += `export const EditorBuiltinScripts: Record<string, string> = {\n`;
for (const file of builtinFiles) {
    const raw = fs.readFileSync(path.join(builtinDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "editor-builtin://${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 2. Generate EditorSystemScripts
const systemDir = path.join(__dirname, '../res/scripts/system');
const systemFiles = fs.existsSync(systemDir) ? fs.readdirSync(systemDir).filter(f => f.endsWith('.lua')) : [];
output += `export const EditorSystemScripts: Record<string, string> = {\n`;
for (const file of systemFiles) {
    const raw = fs.readFileSync(path.join(systemDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 3. Generate EditorTypes (.d.lua files for IDE/Documentation)
const typesDir = path.join(__dirname, '../res/scripts/types');
const typeFiles = fs.existsSync(typesDir) ? fs.readdirSync(typesDir).filter(f => f.endsWith('.d.lua')) : [];
output += `export const EditorTypes: Record<string, string> = {\n`;
for (const file of typeFiles) {
    const raw = fs.readFileSync(path.join(typesDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

fs.writeFileSync(targetFile, output);
console.log(`Generated EditorScriptAssets.ts with ${builtinFiles.length} builtin, ${systemFiles.length} system scripts, and ${typeFiles.length} type definitions.`);
