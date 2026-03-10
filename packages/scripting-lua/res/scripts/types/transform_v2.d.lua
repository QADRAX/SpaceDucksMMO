---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Transform
-- Transform component for position, rotation, and scale manipulation.
-- ═══════════════════════════════════════════════════════════════════════

---Transform component for spatial manipulation.
---@class TransformV2
---@field position Vec3V2|nil Local position `{x, y, z}`.
---@field rotation QuatV2|nil Local rotation as quaternion `{x, y, z, w}`.
---@field scale Vec3V2|nil Local scale `{x, y, z}`.
---@field parent string|nil Parent entity ID, or nil if root.
local TransformV2 = {}

---Get the local position of the entity.
---@return Vec3V2
function TransformV2.getPosition() end

---Set the local position of the entity.
---@param pos Vec3V2 The new position.
function TransformV2.setPosition(pos) end

---Set the local rotation (quaternion).
---@param rot QuatV2 The new rotation as quaternion.
function TransformV2.setRotation(rot) end

---Set the local scale.
---@param s Vec3V2 The new scale.
function TransformV2.setScale(s) end

---Make this transform look at a target position.
---@param target Vec3V2 World position to look at.
---@param worldUp Vec3V2|nil Up vector (defaults to world up).
function TransformV2.lookAt(target, worldUp) end

---Rotate around an axis by an angle (radians).
---@param axis Vec3V2 Rotation axis.
---@param angle number Rotation in radians.
function TransformV2.rotateAxis(axis, angle) end

---Rotate using Euler angles (radians).
---@param x number Rotation around X axis in radians.
---@param y number Rotation around Y axis in radians.
---@param z number Rotation around Z axis in radians.
function TransformV2.rotateEuler(x, y, z) end
