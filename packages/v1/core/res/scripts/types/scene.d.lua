---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Scene
-- Global `scene` table for event-driven communication and instantiation.
-- ═══════════════════════════════════════════════════════════════════════

---@class SceneAPI
---The global scene API table. Used for event communication and prefabs.
---
---**Note:** Direct entity lookups are restricted in Game Mode.
---Use managed references or events for cross-entity interaction.
scene = {}

-- ─── Events ─────────────────────────────────────────────────────────

---Fires a named event on the scene event bus.
---Events are queued and delivered to all listeners during the next event flush
---(between `update` and `lateUpdate`).
---
---Example:
---```lua
---scene.fireEvent("PlayerDied", { entityId = self.id, score = 100 })
---```
---@param eventName string The event name. Can be any string.
---@param data? table Optional payload data delivered to listeners.
function scene.fireEvent(eventName, data) end

---Subscribes to a named event. The listener function is called during event flush.
---Subscriptions are automatically cleaned up when the script slot is destroyed.
---
---Example:
---```lua
---scene.onEvent(self, "PlayerDied", function(data)
---    print("Player " .. data.entityId .. " died!")
---end)
---```
---@param self DuckEntity The calling script's `self` context (used for automatic cleanup).
---@param eventName string The event name to listen for.
---@param listener fun(data: table) Callback invoked with the event payload.
function scene.onEvent(self, eventName, listener) end

-- ─── Prefabs ────────────────────────────────────────────────────────

---Instantiates a prefab from the registry.
---@param key string The prefab ID/key.
---@param overrides? { position?: Vec3|number[], rotation?: Vec3|number[], scale?: Vec3|number[] } Optional overrides.
---@return DuckEntity? root The primary root entity of the new instance.
function scene.instantiatePrefab(key, overrides) end

-- ─── Entity Removal ─────────────────────────────────────────────────

---Destroys an entity by its ID. The entity is removed from the scene graph,
---triggering `onDestroy` on all its script slots and cleaning up subscriptions.
---@param entityId string The entity UUID to destroy.
function scene.destroyEntity(entityId) end

-- ─── Internal / System methods ──────────────────────────────────────
-- These are used by the core engine metatables and system scripts.

---@private
function scene.getComponentProperty(entityId, type, key) end

---@private
function scene.setComponentProperty(entityId, type, key, value) end

---@private
function scene.hasComponent(entityId, type) end

---@private
function scene.getScriptSlotProperty(entityId, scriptId, key) end

---@private
function scene.setScriptSlotProperty(entityId, scriptId, key, value) end

---@private
function scene.getScriptSlotNames(entityId) end

---@private
function scene.addComponent(entityId, type, params) end

---@private
function scene.removeComponent(entityId, type) end

---@private
function scene.applyResource(entityId, key, kind, overrides) end

---@private
function scene.__exists(id) end

---@private
function scene.__getEntity(id) end

-- ─── Reserved Events ────────────────────────────────────────────────
-- The following events are fired automatically by the engine:
--
-- | Event Name       | Payload             | When                           |
-- |------------------|---------------------|--------------------------------|
-- | "SceneReady"     | {}                  | After all init() hooks run     |
-- | "EntityAdded"    | { entityId: string }| When an entity is added        |
-- | "EntityRemoved"  | { entityId: string }| When an entity is removed      |
