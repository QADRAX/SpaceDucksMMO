import * as fs from 'fs';
import * as path from 'path';

const testDir = path.join(__dirname, '../res/scripts/tests');
const targetDir = path.join(__dirname, '../src/__tests__/generated');
const targetFile = path.join(targetDir, 'TestScriptAssets.ts');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

let output = `// Auto-generated file. Do not edit directly.\n`;
output += `// Run 'npm run build:test-scripts' to regenerate.\n\n`;

// Generate TestScripts
const testFiles = fs.existsSync(testDir) ? fs.readdirSync(testDir).filter(f => f.endsWith('.lua')) : [];
output += `export const TestScripts: Record<string, string> = {\n`;
for (const file of testFiles) {
    const raw = fs.readFileSync(path.join(testDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "test://${file}": \`${escaped}\`,\n`;
}
output += `};\n`;

fs.writeFileSync(targetFile, output);
console.log(`Generated TestScriptAssets.ts with ${testFiles.length} test scripts.`);
