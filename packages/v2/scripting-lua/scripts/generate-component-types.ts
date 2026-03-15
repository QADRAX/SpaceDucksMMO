/**
 * Generates res/scripts/types/components_v2.d.lua from core-v2 component specs.
 * Run: pnpm run generate:component-types
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  IDENTITY_SPECS,
  GEOMETRY_SPECS,
  MATERIAL_SPECS,
  SHADER_MATERIAL_SPECS,
  CAMERA_SPECS,
  TEXTURE_SPECS,
  LIGHT_SPECS,
  EFFECT_SPECS,
  ENVIRONMENT_SPECS,
  PHYSICS_SPECS,
  SCRIPTING_SPECS,
  RESOURCE_KINDS,
} from '@duckengine/core-v2';

const ALL_SPECS: Record<string, unknown> = {
  ...IDENTITY_SPECS,
  ...GEOMETRY_SPECS,
  ...MATERIAL_SPECS,
  ...SHADER_MATERIAL_SPECS,
  ...CAMERA_SPECS,
  ...TEXTURE_SPECS,
  ...LIGHT_SPECS,
  ...EFFECT_SPECS,
  ...ENVIRONMENT_SPECS,
  ...PHYSICS_SPECS,
  ...SCRIPTING_SPECS,
};

const COMPONENT_TYPES = Object.keys(ALL_SPECS) as string[];
const RESOURCE_KINDS_ARR = [...RESOURCE_KINDS];

const componentTypeAlias = COMPONENT_TYPES.map((t) => `---| "${t}"`).join('\n');
const resourceKindAlias = RESOURCE_KINDS_ARR.map((k) => `---| "${k}"`).join('\n');

function toFieldKeyAliasName(componentType: string): string {
  const pascal = componentType
    .replace(/(?:^|_)([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/_/g, '');
  return `${pascal}FieldV2`;
}

function buildFieldKeyAliases(): string {
  const lines: string[] = [];
  for (const [type, spec] of Object.entries(ALL_SPECS)) {
    const meta = (spec as { metadata?: { inspector?: { fields?: { key: string }[] } } }).metadata;
    const fields = meta?.inspector?.fields ?? [];
    if (fields.length === 0) continue;
    const aliasName = toFieldKeyAliasName(type);
    const fieldLines = fields.map((f) => `---| "${f.key}"`).join('\n');
    lines.push(`---@alias ${aliasName}\n${fieldLines}`);
  }
  return lines.join('\n\n');
}

const fieldKeyAliases = buildFieldKeyAliases();

const output = `---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Component Bridge
--
-- Generic read/write of any component field. Access via self.Component.
-- Supports dot-notation (e.g. halfExtents.x), ResourceRef via setResource,
-- and full component snapshot via getData.
--
-- AUTO-GENERATED. Run: pnpm run generate:component-types
-- ═══════════════════════════════════════════════════════════════════════

---Component bridge for generic component field access.
---@class ComponentV2
Component = {}

---Get a field value (supports dot-notation).
---@param entityId string Entity ID.
---@param componentType ComponentTypeV2 Component type.
---@param fieldKey string Field key (e.g. "halfExtents.x", "mass").
---@return any
function Component.getField(entityId, componentType, fieldKey) end

---Set a field value (validates against inspector metadata).
---@param entityId string Entity ID.
---@param componentType ComponentTypeV2 Component type.
---@param fieldKey string Field key.
---@param value any New value.
---@return boolean true on success.
function Component.setField(entityId, componentType, fieldKey, value) end

---Set a resource field by key (builds ResourceRef from field metadata).
---@param entityId string Entity ID.
---@param componentType ComponentTypeV2 Component type.
---@param fieldKey string Field key (e.g. "albedo", "mesh", "skybox").
---@param resourceKey string Resource key (e.g. "textures/concrete-muddy").
---@param kindOverride? ResourceKindV2 Optional kind override when field accepts multiple.
---@return boolean true on success.
function Component.setResource(entityId, componentType, fieldKey, resourceKey, kindOverride) end

---Get full component snapshot (readonly).
---@param entityId string Entity ID.
---@param componentType ComponentTypeV2 Component type.
---@return table|nil Frozen snapshot or nil if not found.
function Component.getData(entityId, componentType) end

---Check if entity has the component.
---@param entityId string Entity ID.
---@param componentType ComponentTypeV2 Component type.
---@return boolean
function Component.has(entityId, componentType) end

---@alias ComponentTypeV2
${componentTypeAlias}

---@alias ResourceKindV2
${resourceKindAlias}

-- Field key aliases per component (for Component.getField/setField autocomplete)
${fieldKeyAliases}
`;

const targetPath = path.join(
  __dirname,
  '../res/scripts/types/components_v2.d.lua',
);
fs.writeFileSync(targetPath, output, 'utf-8');
console.log('Generated:', targetPath);
