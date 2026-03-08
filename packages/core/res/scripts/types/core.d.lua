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




---@class ScriptInstance<P, S> : DuckEntity<P, S>

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
---| "vec3"      # A 3-component vector `{x, y, z}` (rendered as 3 inputs). Auto-hydrated to `Vec3` with full operator and method support (`:clone()`, `:length()`, `+`, `-`, etc.).
---| "entity"    # An entity reference (rendered as entity picker). Auto-hydrated to DuckEntity.
---| "component" # Target entity's Component reference. Auto-hydrated to proxy. Needs `componentType`.
---| "material"  # A material resource reference (rendered as material picker).
---| "mesh"      # A mesh resource reference (rendered as mesh picker).
---| "skybox"    # A skybox resource reference (rendered as skybox picker).
---| "prefab"    # A prefab resource reference. Hydrated to LuaPrefab with :instantiate().
---| "enum"      # A dropdown list of string options (defined in `options`).
---| "entityArray" # An ordered array of entity references. Auto-hydrated to `DuckEntity[]`.

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
---| "firstPersonMove"        # Kinematic first-person movement.
---| "firstPersonPhysicsMove" # Physics-based first-person movement.
---| "mouseLook"              # Mouse-based camera rotation.
---| "lookAtEntity"           # Automatically look at another entity.
---| "lookAtPoint"            # Automatically look at a world point.
---| "orbit"                  # Orbit around a target entity.

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

-- ───────────────────────────────────────────────────────────────────────
-- Script Registry (Built-ins)
-- ───────────────────────────────────────────────────────────────────────

---A registry of all built-in scripts and helpers for custom script paths.
---Use this to avoid hardcoding strings.
---@class ScriptAPI
---@field FirstPersonMove        string "builtin://first_person_move.lua"
---@field FirstPersonPhysicsMove string "builtin://first_person_physics_move.lua"
---@field FollowEntity           string "builtin://follow_entity.lua"
---@field FollowEntityPhysics    string "builtin://follow_entity_physics.lua"
---@field LookAtEntity           string "builtin://look_at_entity.lua"
---@field LookAtPoint            string "builtin://look_at_point.lua"
---@field MouseLook              string "builtin://mouse_look.lua"
---@field MoveToPoint            string "builtin://move_to_point.lua"
---@field OrbitCamera            string "builtin://orbit_camera.lua"
---@field SmoothFollow           string "builtin://smooth_follow.lua"
---@field SmoothLookAt           string "builtin://smooth_look_at.lua"
---@field Billboard              string "builtin://billboard.lua"
---@field RotateContinuous       string "builtin://rotate_continuous.lua"
---@field Bounce                 string "builtin://bounce.lua"
---@field WaypointPath           string "builtin://waypoint_path.lua"
---@field SpawnOnInterval        string "builtin://spawn_on_interval.lua"
---@field DestroyAfter           string "builtin://destroy_after.lua"
local ScriptAPI = {}

---Returns the full path for a custom editor script.
---@param name string The filename without extension (e.g. "my_tool").
---@return string path "editor://my_tool.lua"
function ScriptAPI.editor(name) end

---Returns the full path for a custom project script.
---@param name string The filename without extension (e.g. "player_controller").
---@return string path "project://player_controller.lua"
function ScriptAPI.project(name) end

---@type ScriptAPI Global script reference table.
Script = {
    FirstPersonMove        = "builtin://first_person_move.lua",
    FirstPersonPhysicsMove = "builtin://first_person_physics_move.lua",
    FollowEntity           = "builtin://follow_entity.lua",
    FollowEntityPhysics    = "builtin://follow_entity_physics.lua",
    LookAtEntity           = "builtin://look_at_entity.lua",
    LookAtPoint            = "builtin://look_at_point.lua",
    MouseLook              = "builtin://mouse_look.lua",
    MoveToPoint            = "builtin://move_to_point.lua",
    OrbitCamera            = "builtin://orbit_camera.lua",
    SmoothFollow           = "builtin://smooth_follow.lua",
    SmoothLookAt           = "builtin://smooth_look_at.lua",
    Billboard              = "builtin://billboard.lua",
    RotateContinuous       = "builtin://rotate_continuous.lua",
    Bounce                 = "builtin://bounce.lua",
    WaypointPath           = "builtin://waypoint_path.lua",
    SpawnOnInterval        = "builtin://spawn_on_interval.lua",
    DestroyAfter           = "builtin://destroy_after.lua",
}
