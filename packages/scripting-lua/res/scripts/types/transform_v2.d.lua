---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Transform
-- Transform component for position, rotation, and scale manipulation.
-- SOURCE OF TRUTH: transformBridge.ts (createScopedBridge injects entityId).
-- ═══════════════════════════════════════════════════════════════════════

---Transform component for spatial manipulation.
---All getters return a table `{x, y, z}` which behaves like a Vec3V2.
---All setters support either a Vec3V2 table or three numbers (x, y, z).
---@class TransformV2
local TransformV2 = {}

---Get the WORLD position of the entity.
---@return Vec3V2
function TransformV2.getPosition() end

---Set the WORLD position of the entity.
---@param x Vec3V2|number The new position vector, or X coordinate.
---@param y number|nil Y coordinate (if x is a number).
---@param z number|nil Z coordinate (if x is a number).
function TransformV2.setPosition(x, y, z) end

---Get the WORLD rotation (Euler YXZ in radians).
---@return Vec3V2
function TransformV2.getRotation() end

---Set the WORLD rotation (Euler YXZ in radians).
---@param x Vec3V2|number The new rotation vector, or X coordinate.
---@param y number|nil Y coordinate (if x is a number).
---@param z number|nil Z coordinate (if x is a number).
function TransformV2.setRotation(x, y, z) end

---Get the WORLD scale.
---@return Vec3V2
function TransformV2.getScale() end

---Set the WORLD scale.
---@param x Vec3V2|number The new scale vector, or X coordinate.
---@param y number|nil Y coordinate (if x is a number).
---@param z number|nil Z coordinate (if x is a number).
function TransformV2.setScale(x, y, z) end

---Get the LOCAL position of the entity.
---@return Vec3V2
function TransformV2.getLocalPosition() end

---Get the LOCAL rotation (Euler YXZ in radians).
---@return Vec3V2
function TransformV2.getLocalRotation() end

---Get the LOCAL scale.
---@return Vec3V2
function TransformV2.getLocalScale() end

---Make this transform look at a target world position.
---@param target Vec3V2 World position to look at.
function TransformV2.lookAt(target) end

---Get the normalized forward direction (-Z rotated by world rotation).
---@return Vec3V2
function TransformV2.getForward() end

---Get the normalized right direction (+X rotated by world rotation).
---@return Vec3V2
function TransformV2.getRight() end

