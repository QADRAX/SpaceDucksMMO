---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Entity
-- The DuckEntityV2 class representing an ECS entity with OOP methods
-- for transform, physics, and game logic in v2 scripting system.
-- ═══════════════════════════════════════════════════════════════════════

---@class EntityComponentsV2
---Pose facade over ECS `transform3d` (nil methods / has()=false when missing or disabled).
---@field transform TransformV2
---Alias for `transform` (ECS type name).
---@field transform3d TransformV2
---@field script ScriptsV2

---An ECS entity exposed to Lua via the `__EntityMT` metatable.
---Returned by `self.entity` and `self.references`.
---@class EntityWrapperV2
---@field id string The unique UUID of this entity in the scene.
---@field components EntityComponentsV2 Access to the entity's component APIs.
