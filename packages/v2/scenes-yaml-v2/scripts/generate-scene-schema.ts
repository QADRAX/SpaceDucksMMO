/**
 * Generates res/scene.schema.json and src/infrastructure/scene.schema.generated.ts.
 * Run: pnpm run generate:scene-schema
 * The .generated.ts embeds the schema for browser/SPA (no fs at runtime).
 */
import * as fs from 'fs';
import * as path from 'path';
import { buildJsonSchemaFromSpecs } from '../src/domain/schemaGenerator';

const schema = buildJsonSchemaFromSpecs();

// JSON file for VS Code, CI, ajv CLI
const resDir = path.join(__dirname, '../res');
if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });
const jsonPath = path.join(resDir, 'scene.schema.json');
fs.writeFileSync(jsonPath, JSON.stringify(schema, null, 2), 'utf-8');
console.log('Generated:', jsonPath);

// TS export for browser bundle (no fs at runtime)
const schemaStr = JSON.stringify(schema);
const tsContent = `/** Auto-generated. Run: pnpm run generate:scene-schema */\nexport const SCENE_SCHEMA: object = ${schemaStr} as object;\n`;
const tsPath = path.join(__dirname, '../src/infrastructure/scene.schema.generated.ts');
fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log('Generated:', tsPath);
