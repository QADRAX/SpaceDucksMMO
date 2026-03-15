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

-- Field key aliases per component (for Component.getField/setField autocomplete)
---@alias NameFieldV2
---| "value"

---@alias BoxGeometryFieldV2
---| "width"
---| "height"
---| "depth"
---| "castShadow"
---| "receiveShadow"

---@alias SphereGeometryFieldV2
---| "radius"
---| "widthSegments"
---| "heightSegments"
---| "castShadow"
---| "receiveShadow"

---@alias PlaneGeometryFieldV2
---| "width"
---| "height"
---| "castShadow"
---| "receiveShadow"

---@alias CylinderGeometryFieldV2
---| "radiusTop"
---| "radiusBottom"
---| "height"
---| "radialSegments"
---| "castShadow"
---| "receiveShadow"

---@alias ConeGeometryFieldV2
---| "radius"
---| "height"
---| "radialSegments"
---| "castShadow"
---| "receiveShadow"

---@alias TorusGeometryFieldV2
---| "radius"
---| "tube"
---| "radialSegments"
---| "tubularSegments"
---| "castShadow"
---| "receiveShadow"

---@alias CustomGeometryFieldV2
---| "mesh"
---| "castShadow"
---| "receiveShadow"

---@alias StandardMaterialFieldV2
---| "material"
---| "color"
---| "transparent"
---| "opacity"
---| "albedo"
---| "metalness"
---| "roughness"
---| "emissive"
---| "emissiveIntensity"
---| "normalMap"
---| "aoMap"
---| "roughnessMap"
---| "metallicMap"
---| "envMap"

---@alias BasicMaterialFieldV2
---| "material"
---| "color"
---| "transparent"
---| "opacity"
---| "albedo"
---| "wireframe"

---@alias PhongMaterialFieldV2
---| "material"
---| "color"
---| "transparent"
---| "opacity"
---| "albedo"
---| "specular"
---| "shininess"
---| "emissive"

---@alias LambertMaterialFieldV2
---| "material"
---| "color"
---| "transparent"
---| "opacity"
---| "albedo"
---| "emissive"

---@alias BasicShaderMaterialFieldV2
---| "shader"
---| "uniforms"
---| "transparent"
---| "depthWrite"
---| "blending"

---@alias StandardShaderMaterialFieldV2
---| "shader"
---| "uniforms"
---| "transparent"
---| "depthWrite"
---| "blending"
---| "roughness"
---| "metalness"

---@alias PhysicalShaderMaterialFieldV2
---| "shader"
---| "uniforms"
---| "transparent"
---| "depthWrite"
---| "blending"
---| "roughness"
---| "metalness"
---| "clearcoat"
---| "transmission"
---| "ior"
---| "thickness"

---@alias CameraViewFieldV2
---| "fov"
---| "near"
---| "far"
---| "aspect"

---@alias PostProcessFieldV2
---| "effects"

---@alias TextureTilingFieldV2
---| "repeatU"
---| "repeatV"
---| "offsetU"
---| "offsetV"

---@alias AmbientLightFieldV2
---| "color"
---| "intensity"

---@alias DirectionalLightFieldV2
---| "color"
---| "intensity"
---| "castShadow"
---| "shadowMapSize"
---| "shadowBias"
---| "shadowNormalBias"
---| "shadowCameraLeft"
---| "shadowCameraRight"
---| "shadowCameraTop"
---| "shadowCameraBottom"
---| "shadowCameraNear"
---| "shadowCameraFar"

---@alias PointLightFieldV2
---| "color"
---| "intensity"
---| "distance"
---| "decay"
---| "castShadow"
---| "shadowMapSize"
---| "shadowBias"
---| "shadowNormalBias"

---@alias SpotLightFieldV2
---| "color"
---| "intensity"
---| "distance"
---| "angle"
---| "penumbra"
---| "castShadow"
---| "shadowMapSize"
---| "shadowBias"
---| "shadowNormalBias"

---@alias LensFlareFieldV2
---| "intensity"
---| "color"
---| "occlusionEnabled"
---| "viewDotMin"
---| "viewDotMax"
---| "centerFadeStart"
---| "centerFadeEnd"
---| "elementCount"
---| "baseElementSize"
---| "distanceSpread"
---| "axisAngleDeg"
---| "screenOffsetX"
---| "screenOffsetY"
---| "scaleByVisibility"
---| "flareElements"

---@alias SkyboxFieldV2
---| "skybox"

---@alias RigidBodyFieldV2
---| "bodyType"
---| "jointToParent"
---| "mass"
---| "linearDamping"
---| "angularDamping"
---| "gravityScale"
---| "startSleeping"

---@alias GravityFieldV2
---| "x"
---| "y"
---| "z"

---@alias BoxColliderFieldV2
---| "halfExtents.x"
---| "halfExtents.y"
---| "halfExtents.z"
---| "friction"
---| "restitution"
---| "isSensor"

---@alias SphereColliderFieldV2
---| "radius"
---| "friction"
---| "restitution"
---| "isSensor"

---@alias CapsuleColliderFieldV2
---| "radius"
---| "halfHeight"
---| "friction"
---| "restitution"
---| "isSensor"

---@alias CylinderColliderFieldV2
---| "radius"
---| "halfHeight"
---| "friction"
---| "restitution"
---| "isSensor"

---@alias ConeColliderFieldV2
---| "radius"
---| "halfHeight"
---| "friction"
---| "restitution"
---| "isSensor"

---@alias TerrainColliderFieldV2
---| "heightfield.columns"
---| "heightfield.rows"
---| "heightfield.size.x"
---| "heightfield.size.z"
---| "friction"
---| "restitution"
---| "isSensor"

---@alias TrimeshColliderFieldV2
---| "mesh"
---| "friction"
---| "restitution"
---| "isSensor"

---@alias ScriptFieldV2
---| "scripts"
