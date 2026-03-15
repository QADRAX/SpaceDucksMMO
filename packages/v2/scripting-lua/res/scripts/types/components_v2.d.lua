---@meta
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
---@param resourceKey string Resource key (e.g. "textures/floor").
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
---| "name"
---| "boxGeometry"
---| "sphereGeometry"
---| "planeGeometry"
---| "cylinderGeometry"
---| "coneGeometry"
---| "torusGeometry"
---| "customGeometry"
---| "standardMaterial"
---| "basicMaterial"
---| "phongMaterial"
---| "lambertMaterial"
---| "basicShaderMaterial"
---| "standardShaderMaterial"
---| "physicalShaderMaterial"
---| "cameraView"
---| "postProcess"
---| "textureTiling"
---| "ambientLight"
---| "directionalLight"
---| "pointLight"
---| "spotLight"
---| "lensFlare"
---| "skybox"
---| "rigidBody"
---| "gravity"
---| "boxCollider"
---| "sphereCollider"
---| "capsuleCollider"
---| "cylinderCollider"
---| "coneCollider"
---| "terrainCollider"
---| "trimeshCollider"
---| "script"

---@alias ResourceKindV2
---| "standardMaterial"
---| "basicMaterial"
---| "phongMaterial"
---| "lambertMaterial"
---| "basicShaderMaterial"
---| "standardShaderMaterial"
---| "physicalShaderMaterial"
---| "mesh"
---| "skybox"
---| "script"
---| "texture"
