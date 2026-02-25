import * as fs from 'fs';
import * as path from 'path';

const sourceDir = path.join(__dirname, '../res/scripts/builtin');
const targetFile = path.join(__dirname, '../src/domain/scripting/BuiltInScripts.ts');

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.lua'));

let output = `// Auto-generated file. Do not edit directly.\n`;
output += `// Run 'npm run build:scripts' or similar to regenerate.\n\n`;
output += `export const BuiltInScripts: Record<string, string> = {\n`;

for (const file of files) {
    const raw = fs.readFileSync(path.join(sourceDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "builtin://${file}": \`${escaped}\`,\n`;
}

output += `};\n`;

fs.writeFileSync(targetFile, output);
console.log(`Generated ${targetFile} with ${files.length} scripts.`);
