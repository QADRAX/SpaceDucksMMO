---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Entity
-- The DuckEntity class representing an ECS entity with OOP methods
-- for transform, physics, components, and resource application.
--
-- 💡 DESIGN PRINCIPLE: Closed Scripting
-- DuckEngine uses a "Closed Scripting" model for gameplay. Scripts are restricted
-- from global scene queries. Instead, entities must be referenced via the script's
-- `schema.properties`, allowing the engine to manage lifetimes and dependencies.
-- ═══════════════════════════════════════════════════════════════════════

---Proxy giving access to ECS components.
---@class LuaDynamicComponents
---@field [string] LuaComponentProxy

---An ECS entity exposed to Lua via the `__EntityMT` metatable.
---Scripts receive `self` as a DuckEntity in all lifecycle hooks.
---Any entity referenced via schema properties is also a DuckEntity.
---@class DuckEntity
---@field id string The unique UUID of this entity in the scene.
---@field scripts LuaScriptsProxy Cross-script property access. Read/write other scripts' properties via `entity.scripts.scriptName.property`.
---@field components LuaDynamicComponents Dynamic component access via dot notation (e.g., `entity.components.pointLight`).
local DuckEntity = {}

-- ─── Lifecycle ──────────────────────────────────────────────────────

---Returns `true` if this entity still exists in the scene.
---An entity may be destroyed by another script or by scene teardown.
---@return boolean alive `true` if entity is alive, `false` if destroyed.
function DuckEntity:isValid() end

-- ─── Transform: Position ────────────────────────────────────────────

---Gets this entity's local position in world units.
---@return Vec3 position Table with `x`, `y`, `z` fields.
function DuckEntity:getPosition() end

---Sets this entity's local position.
---@param position Vec3
function DuckEntity:setPosition(position) end

-- ─── Transform: Rotation ────────────────────────────────────────────

---Gets this entity's local rotation as Euler angles in radians.
---@return Vec3 rotation Table with `x` (pitch), `y` (yaw), `z` (roll) in radians.
function DuckEntity:getRotation() end

---Sets this entity's local rotation using Euler angles.
---@param rotation Vec3 Euler angles in radians (pitch, yaw, roll).
function DuckEntity:setRotation(rotation) end

-- ─── Transform: Scale ───────────────────────────────────────────────

---Gets this entity's local scale.
---@return Vec3 scale Table with `x`, `y`, `z` scale factors. Default is `{1, 1, 1}`.
function DuckEntity:getScale() end

---Sets this entity's local scale.
---@param scale Vec3 Scale factors on the X, Y, and Z axes.
function DuckEntity:setScale(scale) end

-- ─── Transform: Direction Vectors ───────────────────────────────────

---Returns the entity's forward direction vector (local -Z axis transformed to world space).
---@return Vec3 forward Normalized direction vector.
function DuckEntity:getForward() end

---Returns the entity's right direction vector (local +X axis transformed to world space).
---@return Vec3 right Normalized direction vector.
function DuckEntity:getRight() end

---Returns the entity's up direction vector (local +Y axis transformed to world space).
---@return Vec3 up Normalized direction vector.
function DuckEntity:getUp() end

---Instantly rotates the entity so its forward vector (-Z) points at the given world coordinate.
---@param target Vec3 Target world coordinate.
function DuckEntity:lookAt(target) end

-- ─── Physics ────────────────────────────────────────────────────────

---Gets the linear velocity of this entity's rigid body.
---Returns `{0,0,0}` if the entity has no rigid body.
---@return Vec3 velocity Current velocity in units per second.
function DuckEntity:getLinearVelocity() end

---Applies an instantaneous impulse to this entity's rigid body.
---This changes the velocity immediately. Requires a `rigidBody` component.
---@param impulse Vec3 Impulse force vector.
function DuckEntity:applyImpulse(impulse) end

---Applies a continuous force to this entity's rigid body.
---Force is accumulated and applied during the next physics step.
---@param force Vec3 Force magnitude vector.
function DuckEntity:applyForce(force) end

-- ─── Components ─────────────────────────────────────────────────────

---Adds a new ECS component to this entity.
---If the entity already has a component of this type, this is a no-op.
---@param type ComponentType The component type to add.
---@param params? table Initial properties for the component (e.g., `{ intensity = 2, color = "red" }`).
---@return boolean success `true` if the component was added successfully.
function DuckEntity:addComponent(type, params) end

---Removes an ECS component from this entity.
---The component's render objects (if any) are cleaned up automatically.
---@param type ComponentType The component type to remove.
---@return boolean success `true` if the component existed and was removed.
function DuckEntity:removeComponent(type) end

-- ─── Resources ──────────────────────────────────────────────────────

---Applies a material resource from the resource catalog to this entity.
---Replaces the entity's current material component with the resource data.
---@param key string The resource key, e.g. `"rusty_iron"`, `"glossy_metal"`.
---@param overrides? table Optional property overrides, e.g. `{ metalness = 1.0, color = "#ff0000" }`.
function DuckEntity:applyMaterial(key, overrides) end

---Applies a geometry resource from the resource catalog to this entity.
---Replaces the entity's current geometry component with the resource data.
---@param key string The resource key, e.g. `"hero_ship_model"`.
---@param overrides? table Optional property overrides, e.g. `{ radius = 5 }`.
function DuckEntity:applyGeometry(key, overrides) end

---Applies any resource from the resource catalog to this entity.
---Automatically determines the resource type and applies accordingly.
---@param key string The resource key.
---@param overrides? table Optional property overrides.
function DuckEntity:applyResource(key, overrides) end

-- ─── Cross-Script Property Access ───────────────────────────────────

---Proxy returned when accessing `entity.scripts.scriptName`.
---Reads and writes are forwarded to the target script slot's properties.
---Writes are detected by `checkPropertyChanges()` and trigger `onPropertyChanged`.
---
---Example:
---```lua
---local other = self.targetEntityId -- Hydrated DuckEntity from schema property
---local speed = other.scripts.follow_entity.speed  -- read
---other.scripts.follow_entity.speed = 20           -- write (triggers onPropertyChanged)
---```
---@class LuaScriptSlotProxy
---@field [string] any Read/write access to the script slot's properties.

---Proxy returned by `entity.scripts`.
---Access a specific script slot by its script ID (filename without extension).
---
---Example:
---```lua
---local scripts = entity.scripts
---local followProps = scripts.follow_entity  -- returns LuaScriptSlotProxy
---```
---@class LuaScriptsProxy
---@field first_person_move FirstPersonMoveProps
---@field first_person_physics_move FirstPersonPhysicsMoveProps
---@field follow_entity FollowEntityProps
---@field follow_entity_physics FollowEntityPhysicsProps
---@field look_at_entity LookAtEntityProps
---@field look_at_point LookAtPointProps
---@field mouse_look MouseLookProps
---@field move_to_point MoveToPointProps
---@field orbit_camera OrbitCameraProps
---@field smooth_follow SmoothFollowProps
---@field smooth_look_at SmoothLookAtProps
---@field [string] LuaScriptSlotProxy Fallback for custom user scripts.
local LuaScriptsProxy = {}

-- ─── Component Proxy ────────────────────────────────────────────────

---A dynamic proxy returned when accessing a component by name on an entity.
---Reads and writes are forwarded to the ECS component's properties.
---
---Example:
---```lua
---entity.pointLight.intensity = 5.0
---entity.standardMaterial.metalness = 0.8
---local width = entity.boxGeometry.width
---```
---@alias LuaComponentProxy table<string, any>
