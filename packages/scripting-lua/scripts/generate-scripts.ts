const fs = require('fs');
const path = require('path');

const builtinDir = path.join(__dirname, '../res/scripts/builtin');
const systemDir = path.join(__dirname, '../res/scripts/system');
const targetDir = path.join(__dirname, '../src/generated');
const targetFile = path.join(targetDir, 'ScriptAssets.ts');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
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
  // Escape backticks, dollar signs, and backslashes for template literals
  const escaped = raw
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  const scriptId = file.replace(/\.lua$/, '');
  output += `  "builtin://${scriptId}": \`${escaped}\`,
`;
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
  const escaped = raw
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  const scriptId = file.replace(/\.lua$/, '');
  output += `  "${scriptId}": \`${escaped}\`,
`;
}

output += `};
`;

fs.writeFileSync(targetFile, output);
console.log(
  `Generated ScriptAssets.ts with ${builtinFiles.length} built-in and ${systemFiles.length} system scripts.`,
);
