---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Core Types
-- Foundational types, enums, and aliases used across the entire API.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Script Module
-- ───────────────────────────────────────────────────────────────────────

-- 💡 DUCKENGINE STANDARD: The "Double Generic Pattern"
-- For the best IDE experience (null warnings, autocomplete), define a class
-- that inherits from DuckEntity and provide your properties and state interfaces.
--
-- EXAMPLE:
-- ---@class MyProps
-- ---@field target   DuckEntity  -- Required property (non-nil)
-- ---@field speed    number      -- Required property (non-nil)
-- ---@field damping? number      -- Optional property (nullable)
--
-- ---@class MyState
-- ---@field timer    number
--
-- ---@class MyScript : DuckEntity<MyProps, MyState>
--
-- ---@type ScriptModule<MyScript>
-- return {
--    schema = {
--        properties = {
--            target = { type = "entity", required = true },
--            speed  = { type = "number", required = true },
--            damping = { type = "number", default = 0.5 }
--        }
--    },
--    update = function(self, dt)
--        self.state.timer = (self.state.timer or 0) + dt
--        print(self.properties.target.id) -- Perfect Autocomplete!
--        if self.properties.damping then print(self.properties.damping) end
--    end
-- }




---@class ScriptInstance<P, S> : DuckEntity
---@field properties P Read-only access to the script slot's inspector properties.
---@field state S Persistent per-slot state table. Survives across frames. Use it to store script variables.

---The table returned by every script file. Contains optional schema,
---lifecycle hooks, and the script's behavior logic.
---@generic P, S
---@class ScriptBlueprint<P, S>
---@field schema? SchemaDefinition Declarative metadata and property definitions.
---@field init? fun(self: ScriptInstance<P, S>) Called once when the scene starts playing.
---@field onEnable? fun(self: ScriptInstance<P, S>) Called when the slot is enabled.
---@field earlyUpdate? fun(self: ScriptInstance<P, S>, dt: number) Called every frame, before physics. `dt` is in milliseconds.
---@field update? fun(self: ScriptInstance<P, S>, dt: number) Called every frame, after physics. `dt` is in milliseconds.
---@field lateUpdate? fun(self: ScriptInstance<P, S>, dt: number) Called every frame, after event flush. `dt` is in milliseconds.
---@field onCollisionEnter? fun(self: ScriptInstance<P, S>, other: string) Called when a collision begins. `other` is the colliding entity ID.
---@field onCollisionExit? fun(self: ScriptInstance<P, S>, other: string) Called when a collision ends.
---@field onPropertyChanged? fun(self: ScriptInstance<P, S>, key: string, value: any) Called when a property changes from the inspector or cross-script write.
---@field onDisable? fun(self: ScriptInstance<P, S>) Called when the slot is disabled.
---@field onDestroy? fun(self: ScriptInstance<P, S>) Called when the entity or slot is destroyed.
---@field onDrawGizmos? fun(self: ScriptInstance<P, S>, dt: number) Called every frame in the Gizmo phase. Use the `gizmos` global here.

---@alias ScriptModule<P, S> ScriptBlueprint<P, S>

---@class SchemaDefinition
---@field name? string Human-readable display name for the script.
---@field description? string Description shown in the inspector tooltip.
---@field properties? table<string, PropertyDefinition> Map of property key → definition.
---@field requires? string[] [DEPRECATED] Use `required = true` in each property instead.

---@class PropertyDefinition
---@field type PropertyType The data type of this property.
---@field required? boolean If true, the engine ensures this is non-nil for hooks (managed by ScriptSystem).
---@field default? any Default value when the property is unset.
---@field options? string[] Only for "enum" type. List of valid string options.
---@field componentType? ComponentType Only for "component" type. The ECS component type this property references.
---@field description? string Tooltip text shown in the editor inspector.


-- ───────────────────────────────────────────────────────────────────────
-- Property Type Enum
-- ───────────────────────────────────────────────────────────────────────

---The allowed types for script schema properties.
---@alias PropertyType
---| "number"    # A numeric value (rendered as slider/input in inspector).
---| "string"    # A text value.
---| "boolean"   # A true/false toggle.
---| "vec3"      # A 3-component vector { x, y, z } (rendered as 3 inputs).
---| "entity"    # An entity reference (rendered as entity picker). Auto-hydrated to DuckEntity.
---| "component" # Target entity's Component reference. Auto-hydrated to proxy. Needs `componentType`.
---| "material"  # A material resource reference (rendered as material picker).
---| "mesh"      # A mesh resource reference (rendered as mesh picker).
---| "skybox"    # A skybox resource reference (rendered as skybox picker).
---| "prefab"    # A prefab resource reference. Hydrated to LuaPrefab with :instantiate().
---| "enum"      # A dropdown list of string options (defined in `options`).

-- ───────────────────────────────────────────────────────────────────────
-- Component Type Enum
-- ───────────────────────────────────────────────────────────────────────

---All valid ECS component types. Used with `entity:addComponent(type)` and `entity:removeComponent(type)`.
---@alias ComponentType
---| "transform"               # Base 3D transform.
---| "audioSource"             # Audio playback component.
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
-- Resource IDs (Web Core Parity)
-- ───────────────────────────────────────────────────────────────────────

---@alias ResourceId string

-- Component Materials
---@alias BasicMaterialId ResourceId
---@alias LambertMaterialId ResourceId
---@alias PhongMaterialId ResourceId
---@alias StandardMaterialId ResourceId

-- Shader Materials
---@alias BasicShaderMaterialId ResourceId
---@alias StandardShaderMaterialId ResourceId
---@alias PhysicalShaderMaterialId ResourceId

-- Meshes and Worlds
---@alias CustomMeshId ResourceId
---@alias FullMeshId ResourceId
---@alias SkyboxId ResourceId
---@alias PrefabId ResourceId
---@alias SceneId ResourceId

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
---@return DuckEntity? root The primary root entity of the new instance. Returns nil if failed.
function LuaPrefab:instantiate(overrides) end

-- ───────────────────────────────────────────────────────────────────────
-- Logging
-- ───────────────────────────────────────────────────────────────────────

---Access to the DuckEngine logging system.
---Messages are routed to the central CoreLogger.
---@class LogAPI
local LogAPI = {}

---Logs an informational message.
---@param system string The subsystem name (e.g. "Script", "Physics").
---@param message string The message text.
---@param data? any Optional additional data to log.
function LogAPI:info(system, message, data) end

---Logs a warning message.
---@param system string
---@param message string
---@param data? any
function LogAPI:warn(system, message, data) end

---Logs an error message.
---@param system string
---@param message string
---@param data? any
function LogAPI:error(system, message, data) end

---Logs a debug message.
---@param system string
---@param message string
---@param data? any
function LogAPI:debug(system, message, data) end

---@type LogAPI Global logging instance.
log = {}
