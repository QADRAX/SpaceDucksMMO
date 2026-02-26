---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Core Types
-- Foundational types, enums, and aliases used across the entire API.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Script Module
-- ───────────────────────────────────────────────────────────────────────

---The table returned by every script file. Contains optional schema,
---lifecycle hooks, and the script's behavior logic.
---@class ScriptModule
---@field schema? SchemaDefinition Declarative metadata and property definitions.
---@field init? fun(self: LuaEntity) Called once when the scene starts playing.
---@field onEnable? fun(self: LuaEntity) Called when the slot is enabled.
---@field earlyUpdate? fun(self: LuaEntity, dt: number) Called every frame, before physics. `dt` is in milliseconds.
---@field update? fun(self: LuaEntity, dt: number) Called every frame, after physics. `dt` is in milliseconds.
---@field lateUpdate? fun(self: LuaEntity, dt: number) Called every frame, after event flush. `dt` is in milliseconds.
---@field onCollisionEnter? fun(self: LuaEntity, other: string) Called when a collision begins. `other` is the colliding entity ID.
---@field onCollisionExit? fun(self: LuaEntity, other: string) Called when a collision ends.
---@field onPropertyChanged? fun(self: LuaEntity, key: string, value: any) Called when a property changes from the inspector or cross-script write.
---@field onDisable? fun(self: LuaEntity) Called when the slot is disabled.
---@field onDestroy? fun(self: LuaEntity) Called when the entity or slot is destroyed.
---@field onDrawGizmos? fun(self: LuaEntity, dt: number) Called every frame in the Gizmo phase. Use the `gizmos` global here.

---@class SchemaDefinition
---@field name? string Human-readable display name for the script.
---@field description? string Description shown in the inspector tooltip.
---@field properties? table<string, PropertyDefinition> Map of property key → definition.
---@field requires? string[] List of property keys that must be non-nil for update hooks to run.

---@class PropertyDefinition
---@field type PropertyType The data type of this property.
---@field default? any Default value when the property is unset.
---@field description? string Tooltip text shown in the editor inspector.

-- ───────────────────────────────────────────────────────────────────────
-- Property Type Enum
-- ───────────────────────────────────────────────────────────────────────

---The allowed types for script schema properties.
---@alias PropertyType
---| "number"   # A numeric value (rendered as slider/input in inspector).
---| "string"   # A text value.
---| "boolean"  # A true/false toggle.
---| "vec3"     # A 3-component vector { x, y, z } (rendered as 3 inputs).
---| "entity"   # An entity reference (rendered as entity picker). Auto-hydrated to LuaEntity.
---| "material" # A material resource reference (rendered as material picker).
---| "mesh"     # A mesh resource reference (rendered as mesh picker).
---| "skybox"   # A skybox resource reference (rendered as skybox picker).
---| "prefab"   # A prefab resource reference. Hydrated to LuaPrefab with :instantiate().

-- ───────────────────────────────────────────────────────────────────────
-- Vec3
-- ───────────────────────────────────────────────────────────────────────

---A 3-component vector used for positions, rotations, scales, and directions.
---@class Vec3
---@field x number The X component.
---@field y number The Y component.
---@field z number The Z component.

-- ───────────────────────────────────────────────────────────────────────
-- Component Type Enum
-- ───────────────────────────────────────────────────────────────────────

---All valid ECS component types. Used with `entity:addComponent(type)` and `entity:removeComponent(type)`.
---@alias ComponentType
---| "name"                    # Display name component.
---| "boxGeometry"             # Box primitive geometry.
---| "sphereGeometry"          # Sphere primitive geometry.
---| "planeGeometry"           # Plane primitive geometry.
---| "cylinderGeometry"        # Cylinder primitive geometry.
---| "coneGeometry"            # Cone primitive geometry.
---| "torusGeometry"           # Torus (donut) primitive geometry.
---| "customGeometry"          # Custom mesh geometry loaded from resource.
---| "fullMesh"                # Full 3D model (GLB/GLTF).
---| "standardMaterial"        # PBR standard material (metalness/roughness).
---| "basicMaterial"           # Unlit basic material.
---| "phongMaterial"           # Phong shading material.
---| "lambertMaterial"         # Lambert diffuse material.
---| "basicShaderMaterial"     # Custom basic shader material.
---| "standardShaderMaterial"  # Custom standard shader material.
---| "physicalShaderMaterial"  # Custom physically-based shader material.
---| "textureTiling"           # Texture tiling/repeat settings.
---| "ambientLight"            # Scene-wide ambient light.
---| "directionalLight"        # Directional sun-like light.
---| "pointLight"              # Omnidirectional point light.
---| "spotLight"               # Cone-shaped spot light.
---| "skybox"                  # Skybox / environment map.
---| "rigidBody"               # Physics rigid body.
---| "gravity"                 # Per-entity gravity override.
---| "sphereCollider"          # Sphere collision shape.
---| "boxCollider"             # Box collision shape.
---| "capsuleCollider"         # Capsule collision shape.
---| "cylinderCollider"        # Cylinder collision shape.
---| "coneCollider"            # Cone collision shape.
---| "terrainCollider"         # Heightmap terrain collider.
---| "cameraView"              # Camera projection settings.
---| "lensFlare"               # Lens flare post-effect.
---| "postProcess"             # Post-processing pipeline settings.
---| "script"                  # Lua script component (slot container).
---| "metadata"                # Arbitrary metadata key-value store.

-- ───────────────────────────────────────────────────────────────────────
-- Orbit Plane Enum
-- ───────────────────────────────────────────────────────────────────────

---Valid orbit planes for the orbit camera script.
---@alias OrbitPlane
---| "xz" # Horizontal orbit (default, top-down circle).
---| "xy" # Vertical orbit in the XY plane.
---| "yz" # Vertical orbit in the YZ plane.

-- ───────────────────────────────────────────────────────────────────────
-- Prefab
-- ───────────────────────────────────────────────────────────────────────

---A template for an entity or entity tree.
---Hydrated from the schema "prefab" property.
---@class LuaPrefab
---@field key string The resource key of this prefab.
local LuaPrefab = {}

---Instantiates this prefab in the scene.
---@param overrides? { position?: Vec3|number[], rotation?: Vec3|number[], scale?: Vec3|number[] } Optional overrides.
---@return LuaEntity? root The primary root entity of the new instance. Returns nil if failed.
function LuaPrefab:instantiate(overrides) end
