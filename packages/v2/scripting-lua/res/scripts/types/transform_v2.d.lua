---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Transform
-- Facade over ECS component `transform3d` (not a separate entity field).
-- Soft null-logic: missing or disabled pose → has()=false, getters nil, setters false.
-- SOURCE OF TRUTH: transformBridge.ts (createScopedBridge injects entityId).
-- ═══════════════════════════════════════════════════════════════════════

---Pose facade for spatial manipulation (active transform3d only).
---Access via `self.Transform`, `self.entity.components.transform`, or
---`self.entity.components.transform3d` (alias).
---@class TransformV2
local TransformV2 = {}

---True when this entity has an active (present + enabled) transform3d.
---@return boolean
function TransformV2.has() end

---Authoring flag on the raw transform3d (works while disabled). Nil if missing.
---@return boolean|nil
function TransformV2.isEnabled() end

---Toggle spatial participation (ComponentBase.enabled on transform3d).
---@param enabled boolean
---@return boolean true on success.
function TransformV2.setEnabled(enabled) end

---Get the WORLD position of the entity, or nil if no active pose.
---@return Vec3V2|nil
function TransformV2.getPosition() end

---Set the WORLD position. Returns false if no active pose.
---@param x Vec3V2|number The new position vector, or X coordinate.
---@param y number|nil Y coordinate (if x is a number).
---@param z number|nil Z coordinate (if x is a number).
---@return boolean
function TransformV2.setPosition(x, y, z) end

---Get the WORLD rotation (Euler YXZ in radians), or nil if no active pose.
---@return Vec3V2|nil
function TransformV2.getRotation() end

---Set the WORLD rotation (Euler YXZ in radians). Returns false if no active pose.
---@param x Vec3V2|number The new rotation vector, or X coordinate.
---@param y number|nil Y coordinate (if x is a number).
---@param z number|nil Z coordinate (if x is a number).
---@return boolean
function TransformV2.setRotation(x, y, z) end

---Get the WORLD scale, or nil if no active pose.
---@return Vec3V2|nil
function TransformV2.getScale() end

---Set the WORLD scale. Returns false if no active pose.
---@param x Vec3V2|number The new scale vector, or X coordinate.
---@param y number|nil Y coordinate (if x is a number).
---@param z number|nil Z coordinate (if x is a number).
---@return boolean
function TransformV2.setScale(x, y, z) end

---Get the LOCAL position, or nil if no active pose.
---@return Vec3V2|nil
function TransformV2.getLocalPosition() end

---Get the LOCAL rotation (Euler YXZ in radians), or nil if no active pose.
---@return Vec3V2|nil
function TransformV2.getLocalRotation() end

---Get the LOCAL scale, or nil if no active pose.
---@return Vec3V2|nil
function TransformV2.getLocalScale() end

---Make this transform look at a target world position. Returns false if no active pose.
---@param target Vec3V2 World position to look at.
---@return boolean
function TransformV2.lookAt(target) end

---Get the normalized forward direction (-Z), or nil if no active pose.
---@return Vec3V2|nil
function TransformV2.getForward() end

---Get the normalized right direction (+X), or nil if no active pose.
---@return Vec3V2|nil
function TransformV2.getRight() end
