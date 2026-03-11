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

// Generate BuiltInScripts (content map) and BuiltInScriptIds (TS schema keys only — NOT injected to Lua)
const builtinFiles = fs.existsSync(builtinDir)
  ? fs.readdirSync(builtinDir).filter((f: string) => f.endsWith('.lua')).sort()
  : [];

function toPascalCase(snake: string): string {
  return snake
    .replace(/\.lua$/, '')
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

// Write builtin_scripts.lua to system/ — Lua source of truth, loaded at sandbox boot
const builtinScriptsLua = `-- Auto-generated. Run 'npm run build:scripts' to regenerate.
-- Built-in script ID constants. Lua source of truth (not injected from TS).

BuiltInScripts = {
${builtinFiles.map((f: string) => `    ${toPascalCase(f)} = "builtin://${f}",`).join('\n')}
}
`;
fs.writeFileSync(path.join(systemDir, 'builtin_scripts.lua'), builtinScriptsLua);

output += `/** Script ID constants for schema keys only. Lua uses res/scripts/system/builtin_scripts.lua */\n`;
output += `export const BuiltInScriptIds = {\n`;
for (const file of builtinFiles) {
  const id = toPascalCase(file);
  output += `  ${id}: "builtin://${file}",\n`;
}
output += `} as const;\n\n`;

output += `/** Built-in script content map. Keys are script URIs. */\n`;
output += `export const BuiltInScripts: Record<string, string> = {\n`;
for (const file of builtinFiles) {
  const raw = fs.readFileSync(path.join(builtinDir, file), 'utf-8');
  output += `  "builtin://${file}": \`${escapeForTemplate(raw)}\`,\n`;
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

// Generate TestScriptAssets.ts (separate from production ScriptAssets)
const testFiles = fs.existsSync(testsDir)
  ? fs
      .readdirSync(testsDir)
      .filter((f: string) => f.endsWith('.lua') && !f.endsWith('.d.lua'))
      .sort()
  : [];

const testOutput = `// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' to regenerate.
// Test scripts only — separate from production ScriptAssets.

/** Integration test scripts. Keys are test:// URIs. */
export const TestScripts: Record<string, string> = {
${testFiles.map((file: string) => {
  const raw = fs.readFileSync(path.join(testsDir, file), 'utf-8');
  return `  "test://${file}": \`${escapeForTemplate(raw)}\`,`;
}).join('\n')}
};
`;

const testTargetFile = path.join(targetDir, 'TestScriptAssets.ts');
fs.writeFileSync(testTargetFile, testOutput);

console.log(
  `Generated ScriptAssets.ts (${builtinFiles.length} built-in, ${systemFiles.length} system) and TestScriptAssets.ts (${testFiles.length} test).`,
);
