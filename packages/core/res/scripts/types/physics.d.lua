---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Physics
-- Global `physics` table for physics queries (raycasting).
-- Per-entity physics methods are on LuaEntity (see entity.d.lua).
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
---methods (`applyImpulse`, `applyForce`, `getLinearVelocity`) are on LuaEntity.
physics = {}

---Casts a ray from `origin` in `direction` and returns the first collider hit.
---Returns `nil` if no collider was hit within `maxDist`.
---
---Example:
---```lua
---local hit = physics.raycast(0, 5, 0, 0, -1, 0, 100)
---if hit then
---    print("Hit entity: " .. hit.entityId .. " at distance " .. hit.distance)
---end
---```
---@param ox number Ray origin X.
---@param oy number Ray origin Y.
---@param oz number Ray origin Z.
---@param dx number Ray direction X (does not need to be normalized).
---@param dy number Ray direction Y.
---@param dz number Ray direction Z.
---@param maxDist? number Maximum ray distance. Defaults to infinity if omitted.
---@return RaycastHit? hit The first hit result, or `nil` if nothing was hit.
function physics.raycast(ox, oy, oz, dx, dy, dz, maxDist) end
