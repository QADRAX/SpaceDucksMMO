import * as fs from 'fs';
import * as path from 'path';

const builtinDir = path.join(__dirname, '../res/scripts/builtin');
const systemDir = path.join(__dirname, '../res/scripts/system');
const targetDir = path.join(__dirname, '../src/domain/scripting/generated');
const targetFile = path.join(targetDir, 'ScriptAssets.ts');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

let output = `// Auto-generated file. Do not edit directly.\n`;
output += `// Run 'npm run build:scripts' to regenerate.\n\n`;

// 1. Generate BuiltInScripts
const builtinFiles = fs.existsSync(builtinDir) ? fs.readdirSync(builtinDir).filter(f => f.endsWith('.lua')) : [];
output += `export const BuiltInScripts: Record<string, string> = {\n`;
for (const file of builtinFiles) {
    const raw = fs.readFileSync(path.join(builtinDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "builtin://${file}": \`${escaped}\`,\n`;
}
output += `};\n\n`;

// 2. Generate SystemScripts
const systemFiles = fs.existsSync(systemDir) ? fs.readdirSync(systemDir).filter(f => f.endsWith('.lua')) : [];
output += `export const SystemScripts: Record<string, string> = {\n`;
for (const file of systemFiles) {
    const raw = fs.readFileSync(path.join(systemDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "${file}": \`${escaped}\`,\n`;
}
output += `};\n`;

fs.writeFileSync(targetFile, output);
console.log(`Generated ScriptAssets.ts with ${builtinFiles.length} built-in and ${systemFiles.length} system scripts.`);
