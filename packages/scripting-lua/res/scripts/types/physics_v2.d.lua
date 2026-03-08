---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Physics
-- Physics queries and force application for rigid bodies.
-- ═══════════════════════════════════════════════════════════════════════

---Physics raycast query parameters.
---@class RaycastQueryV2
---@field origin Vec3V2 Ray origin in world space.
---@field direction Vec3V2 Ray direction (should be normalized).
---@field maxDistance number Maximum raycast distance.

---Physics raycast hit result.
---@class RaycastHitV2
---@field entityId string ID of the entity that was hit.
---@field point Vec3V2 World-space point where the ray hit the surface.
---@field normal Vec3V2 Surface normal at the hit point.
---@field distance number Distance from ray origin to hit point.

---Physics system bridge.
---@class PhysicsV2
physics = {}

---Apply an instantaneous impulse to an entity's rigid body.
---@param force Vec3V2 Impulse vector.
function physics:applyImpulse(force) end

---Apply a continuous force to an entity's rigid body.
---@param force Vec3V2 Force vector.
function physics:applyForce(force) end

---Cast a ray and return the first collider hit.
---@param ray RaycastQueryV2 Raycast parameters.
---@return RaycastHitV2|nil hit The first hit result, or nil if nothing was hit.
function physics.raycast(ray) end
