const fs = require('fs');
const path = require('path');

const builtinDir = path.join(__dirname, '../res/scripts/builtin');
const systemDir = path.join(__dirname, '../res/scripts/system');
const testsDir = path.join(__dirname, '../res/scripts/tests');
const targetDir = path.join(__dirname, '../src/infrastructure/wasmoon/generated');
const targetFile = path.join(targetDir, 'ScriptAssets.ts');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function escapeForTemplate(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

let output = `// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' to regenerate.

`;

// Generate BuiltInScripts
const builtinFiles = fs.existsSync(builtinDir)
  ? fs.readdirSync(builtinDir).filter((f: string) => f.endsWith('.lua'))
  : [];

output += `export const BuiltInScripts: Record<string, string> = {
`;

for (const file of builtinFiles) {
  const raw = fs.readFileSync(path.join(builtinDir, file), 'utf-8');
  output += `  "builtin://${file}": \`${escapeForTemplate(raw)}\`,\n`;
}

output += `};

`;

// Generate TestScripts (for integration tests, isolated component verification)
const testFiles = fs.existsSync(testsDir)
  ? fs.readdirSync(testsDir).filter((f: string) => f.endsWith('.lua'))
  : [];

output += `export const TestScripts: Record<string, string> = {
`;

for (const file of testFiles) {
  const raw = fs.readFileSync(path.join(testsDir, file), 'utf-8');
  output += `  "test://${file}": \`${escapeForTemplate(raw)}\`,\n`;
}

output += `};

`;

// Generate SystemScripts
const systemFiles = fs.existsSync(systemDir)
  ? fs.readdirSync(systemDir).filter((f: string) => f.endsWith('.lua'))
  : [];

output += `export const SystemScripts: Record<string, string> = {
`;

for (const file of systemFiles) {
  const raw = fs.readFileSync(path.join(systemDir, file), 'utf-8');
  const scriptId = file.replace(/\.lua$/, '');
  output += `  "${scriptId}": \`${escapeForTemplate(raw)}\`,
`;
}

output += `};
`;

fs.writeFileSync(targetFile, output);
console.log(
  `Generated ScriptAssets.ts with ${builtinFiles.length} built-in, ${testFiles.length} test, and ${systemFiles.length} system scripts.`,
);
