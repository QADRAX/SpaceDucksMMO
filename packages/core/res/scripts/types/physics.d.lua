---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Physics
-- Global `physics` table for physics queries (raycasting).
-- Per-entity physics methods are on DuckEntity (see entity.d.lua).
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Raycast Hit Result
-- ───────────────────────────────────────────────────────────────────────

---The result of a successful raycast hit.
---@class RaycastHit
---@field entityId string The ID of the entity that was hit.
---@field point Vec3 The world-space point where the ray hit the surface.
---@field normal Vec3 The surface normal at the hit point.
---@field distance number The distance from the ray origin to the hit point in world units.

-- ───────────────────────────────────────────────────────────────────────
-- Physics API
-- ───────────────────────────────────────────────────────────────────────

---@class PhysicsAPI
---The global physics API for physics queries. Per-entity physics
---methods (`applyImpulse`, `applyForce`, `getLinearVelocity`) are on DuckEntity.
physics = {}

---Casts a ray from `origin` in `direction` and returns the first collider hit.
---@param origin Vec3 Ray origin.
---@param direction Vec3 Ray direction (does not need to be normalized).
---@param maxDist? number Maximum ray distance. Defaults to infinity if omitted.
---@return RaycastHit? hit The first hit result, or `nil` if nothing was hit.
function physics.raycast(origin, direction, maxDist) end

---Applies an instantaneous impulse to an entity's rigid body.
---@param target string|DuckEntity Entity ID or reference.
---@param impulse Vec3
function physics.applyImpulse(target, impulse) end

---Applies a continuous force to an entity's rigid body.
---@param target string|DuckEntity Entity ID or reference.
---@param force Vec3
function physics.applyForce(target, force) end

---Gets the linear velocity of an entity's rigid body.
---@param target string|DuckEntity Entity ID or reference.
---@return Vec3 velocity
function physics.getLinearVelocity(target) end
