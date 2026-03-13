import fs from 'fs';
import path from 'path';

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node consolidateImports.mjs <file-path>');
    process.exit(1);
}

const fullPath = path.resolve(filePath);
const fileDir = path.dirname(fullPath);
let content = fs.readFileSync(fullPath, 'utf8');

// Regex for multi-line imports
const importRegex = /import\s+(type\s+)?\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"];?\s*/g;

const importGroups = new Map(); // base path -> { types: Set, values: Set, start: number }
const removedRanges = [];

let match;
while ((match = importRegex.exec(content)) !== null) {
    const isType = !!match[1];
    const items = match[2].split(',').map(s => s.trim()).filter(Boolean);
    const importPath = match[3];

    // Logic: if importPath has more than one segment and the parent has an index.ts
    // e.g. './rendering/light' -> parent is './rendering'. Check if fileDir + './rendering/index.ts' exists.

    if (importPath.includes('/') && !importPath.endsWith('/index') && !importPath.startsWith('@')) {
        const parts = importPath.split('/');
        const baseImportPath = parts.slice(0, -1).join('/');
        const parentDir = path.resolve(fileDir, baseImportPath);

        if (fs.existsSync(path.join(parentDir, 'index.ts')) || fs.existsSync(path.join(parentDir, 'index.js'))) {
            if (!importGroups.has(baseImportPath)) {
                importGroups.set(baseImportPath, { types: new Set(), values: new Set(), start: match.index });
            }
            const group = importGroups.get(baseImportPath);
            items.forEach(item => {
                if (isType) group.types.add(item);
                else group.values.add(item);
            });
            removedRanges.push({ start: match.index, end: importRegex.lastIndex });
        }
    }
}

if (removedRanges.length === 0) {
    console.log(`No imports to consolidate in ${filePath}`);
    process.exit(0);
}

// Sort ranges in descending order to avoid index shifts during deletion
removedRanges.sort((a, b) => b.start - a.start);

let newContent = content;
for (const range of removedRanges) {
    newContent = newContent.substring(0, range.start) + "__REMOVED__" + newContent.substring(range.end);
}

// Sort group entries by their original start position to maintain relative order
const sortedGroups = Array.from(importGroups.entries()).sort((a, b) => a[1].start - b[1].start);

for (const [basePath, group] of sortedGroups) {
    const imports = [];
    if (group.values.size > 0) {
        imports.push(`import { ${Array.from(group.values).sort().join(', ')} } from '${basePath}';\n`);
    }
    if (group.types.size > 0) {
        imports.push(`import type { ${Array.from(group.types).sort().join(', ')} } from '${basePath}';\n`);
    }

    newContent = newContent.replace("__REMOVED__", imports.join(''));
}

// Remove remaining placeholders and fix double newlines
newContent = newContent.replace(/__REMOVED__/g, '');
newContent = newContent.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(fullPath, newContent);
console.log(`Consolidated imports in ${filePath}`);
