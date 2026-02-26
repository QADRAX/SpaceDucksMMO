---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Transform
-- Global `transform` table for world/local transform operations.
-- ═══════════════════════════════════════════════════════════════════════

---@class TransformAPI
---The global transform API for low-level transform manipulations.
---Methods accept either an entity ID (string) or a LuaEntity.
transform = {}

---Gets the world position of an entity.
---@param target string|LuaEntity Entity ID or reference.
---@return Vec3 position
function transform.getPosition(target) end

---Sets the world position of an entity.
---@param target string|LuaEntity Entity ID or reference.
---@param position Vec3
function transform.setPosition(target, position) end

---Gets the world rotation of an entity as Euler angles (radians).
---@param target string|LuaEntity Entity ID or reference.
---@return Vec3 rotation pitch (x), yaw (y), roll (z) in radians.
function transform.getRotation(target) end

---Sets the world rotation of an entity using Euler angles (radians).
---@param target string|LuaEntity Entity ID or reference.
---@param rotation Vec3
function transform.setRotation(target, rotation) end

---Gets the world scale of an entity.
---@param target string|LuaEntity Entity ID or reference.
---@return Vec3 scale
function transform.getScale(target) end

---Sets the world scale of an entity.
---@param target string|LuaEntity Entity ID or reference.
---@param scale Vec3
function transform.setScale(target, scale) end

---Rotates an entity to look at a world point.
---@param target string|LuaEntity Entity ID or reference.
---@param lookPoint Vec3
function transform.lookAt(target, lookPoint) end

---Gets the forward vector (local -Z) in world space.
---@param target string|LuaEntity Entity ID or reference.
---@return Vec3 direction Normalized.
function transform.getForward(target) end

---Gets the right vector (local +X) in world space.
---@param target string|LuaEntity Entity ID or reference.
---@return Vec3 direction Normalized.
function transform.getRight(target) end

---Gets the up vector (local +Y) in world space.
---@param target string|LuaEntity Entity ID or reference.
---@return Vec3 direction Normalized.
function transform.getUp(target) end
