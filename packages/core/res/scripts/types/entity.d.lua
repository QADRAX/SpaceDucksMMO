---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Entity
-- The LuaEntity class representing an ECS entity with OOP methods
-- for transform, physics, components, and resource application.
-- ═══════════════════════════════════════════════════════════════════════

---An ECS entity exposed to Lua via the `__EntityMT` metatable.
---Scripts receive `self` as a LuaEntity in all lifecycle hooks.
---Any entity referenced via schema properties is also a LuaEntity.
---@class LuaEntity
---@field id string The unique UUID of this entity in the scene.
---@field state table Persistent per-slot state table. Survives across frames. Use it to store script variables.
---@field properties table Read-only access to the script slot's inspector properties. Values come from the editor or defaults.
---@field [string] LuaComponentProxy Dynamic component access via dot notation (e.g., `entity.pointLight`, `entity.standardMaterial`).
local LuaEntity = {}

-- ─── Lifecycle ──────────────────────────────────────────────────────

---Returns `true` if this entity still exists in the scene.
---An entity may be destroyed by another script or by scene teardown.
---@return boolean alive `true` if entity is alive, `false` if destroyed.
function LuaEntity:isValid() end

-- ─── Transform: Position ────────────────────────────────────────────

---Gets this entity's local position in world units.
---@return Vec3 position Table with `x`, `y`, `z` fields.
function LuaEntity:getPosition() end

---Sets this entity's local position.
---@param x number World-space X coordinate.
---@param y number World-space Y coordinate.
---@param z number World-space Z coordinate.
function LuaEntity:setPosition(x, y, z) end

-- ─── Transform: Rotation ────────────────────────────────────────────

---Gets this entity's local rotation as Euler angles in radians.
---@return Vec3 rotation Table with `x` (pitch), `y` (yaw), `z` (roll) in radians.
function LuaEntity:getRotation() end

---Sets this entity's local rotation using Euler angles.
---@param x number Pitch in radians (rotation around local X axis).
---@param y number Yaw in radians (rotation around local Y axis).
---@param z number Roll in radians (rotation around local Z axis).
function LuaEntity:setRotation(x, y, z) end

-- ─── Transform: Scale ───────────────────────────────────────────────

---Gets this entity's local scale.
---@return Vec3 scale Table with `x`, `y`, `z` scale factors. Default is `{1, 1, 1}`.
function LuaEntity:getScale() end

---Sets this entity's local scale.
---@param x number Scale factor on the X axis.
---@param y number Scale factor on the Y axis.
---@param z number Scale factor on the Z axis.
function LuaEntity:setScale(x, y, z) end

-- ─── Transform: Direction Vectors ───────────────────────────────────

---Returns the entity's forward direction vector (local -Z axis transformed to world space).
---@return Vec3 forward Normalized direction vector.
function LuaEntity:getForward() end

---Returns the entity's right direction vector (local +X axis transformed to world space).
---@return Vec3 right Normalized direction vector.
function LuaEntity:getRight() end

---Returns the entity's up direction vector (local +Y axis transformed to world space).
---@return Vec3 up Normalized direction vector.
function LuaEntity:getUp() end

---Instantly rotates the entity so its forward vector (-Z) points at the given world coordinate.
---@param x number Target X world coordinate.
---@param y number Target Y world coordinate.
---@param z number Target Z world coordinate.
function LuaEntity:lookAt(x, y, z) end

-- ─── Physics ────────────────────────────────────────────────────────

---Gets the linear velocity of this entity's rigid body.
---Returns `{0,0,0}` if the entity has no rigid body.
---@return Vec3 velocity Current velocity in units per second.
function LuaEntity:getLinearVelocity() end

---Applies an instantaneous impulse to this entity's rigid body.
---This changes the velocity immediately. Requires a `rigidBody` component.
---@param x number Impulse force on the X axis.
---@param y number Impulse force on the Y axis.
---@param z number Impulse force on the Z axis.
function LuaEntity:applyImpulse(x, y, z) end

---Applies a continuous force to this entity's rigid body.
---Force is accumulated and applied during the next physics step.
---@param x number Force magnitude on the X axis.
---@param y number Force magnitude on the Y axis.
---@param z number Force magnitude on the Z axis.
function LuaEntity:applyForce(x, y, z) end

-- ─── Components ─────────────────────────────────────────────────────

---Adds a new ECS component to this entity.
---If the entity already has a component of this type, this is a no-op.
---@param type ComponentType The component type to add.
---@param params? table Initial properties for the component (e.g., `{ intensity = 2, color = "red" }`).
---@return boolean success `true` if the component was added successfully.
function LuaEntity:addComponent(type, params) end

---Removes an ECS component from this entity.
---The component's render objects (if any) are cleaned up automatically.
---@param type ComponentType The component type to remove.
---@return boolean success `true` if the component existed and was removed.
function LuaEntity:removeComponent(type) end

-- ─── Resources ──────────────────────────────────────────────────────

---Applies a material resource from the resource catalog to this entity.
---Replaces the entity's current material component with the resource data.
---@param key string The resource key, e.g. `"rusty_iron"`, `"glossy_metal"`.
---@param overrides? table Optional property overrides, e.g. `{ metalness = 1.0, color = "#ff0000" }`.
function LuaEntity:applyMaterial(key, overrides) end

---Applies a geometry resource from the resource catalog to this entity.
---Replaces the entity's current geometry component with the resource data.
---@param key string The resource key, e.g. `"hero_ship_model"`.
---@param overrides? table Optional property overrides, e.g. `{ radius = 5 }`.
function LuaEntity:applyGeometry(key, overrides) end

---Applies any resource from the resource catalog to this entity.
---Automatically determines the resource type and applies accordingly.
---@param key string The resource key.
---@param overrides? table Optional property overrides.
function LuaEntity:applyResource(key, overrides) end

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
