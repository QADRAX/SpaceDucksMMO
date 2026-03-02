const fs = require('fs');
const path = require('path');

const testScriptsDir = path.join(__dirname, '../src/__tests__/scripts');
const targetDir = path.join(__dirname, '../src/__tests__/generated');
const targetFile = path.join(targetDir, 'PhysicsTestScriptAssets.ts');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

let output = `// Auto-generated file. Do not edit directly.\n`;
output += `// Run 'npm run build:test-scripts' to regenerate.\n\n`;

// Generate TestScripts
const testScriptFiles = fs.existsSync(testScriptsDir) 
    ? fs.readdirSync(testScriptsDir).filter((f: string) => f.endsWith('.lua')) 
    : [];

output += `export const PhysicsTestScripts: Record<string, string> = {\n`;
for (const file of testScriptFiles) {
    const raw = fs.readFileSync(path.join(testScriptsDir, file), 'utf-8');
    const escaped = raw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    "test://${file}": \`${escaped}\`,\n`;
}
output += `};\n`;

fs.writeFileSync(targetFile, output);
console.log(`Generated PhysicsTestScriptAssets.ts with ${testScriptFiles.length} test scripts.`);
