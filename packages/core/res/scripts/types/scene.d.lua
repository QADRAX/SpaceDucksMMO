---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Scene
-- Global `scene` table for event-driven communication and entity lookup.
-- ═══════════════════════════════════════════════════════════════════════

---@class SceneAPI
---The global scene API table. Used for event communication and entity queries.
---
---**Note:** `getEntity`, `findEntityByName`, and `exists` are available but
---will be deprecated in favor of schema-managed entity references.
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
---@param self LuaEntity The calling script's `self` context (used for automatic cleanup).
---@param eventName string The event name to listen for.
---@param listener fun(data: table) Callback invoked with the event payload.
function scene.onEvent(self, eventName, listener) end

-- ─── Reserved Events ────────────────────────────────────────────────
-- The following events are fired automatically by the engine:
--
-- | Event Name       | Payload             | When                           |
-- |------------------|---------------------|--------------------------------|
-- | "SceneReady"     | {}                  | After all init() hooks run     |
-- | "EntityAdded"    | { entityId: string }| When an entity is added        |
-- | "EntityRemoved"  | { entityId: string }| When an entity is removed      |

-- ─── Entity Queries (will be deprecated) ────────────────────────────

---Finds the first entity matching the given display name or name component value.
---
---**⚠️ Prefer schema-managed entity references instead of this function.**
---@param name string The display name to search for.
---@return LuaEntity? entity The found entity, or `nil` if not found.
function scene.findEntityByName(name) end

---Returns the entity with the given ID, wrapped as a LuaEntity.
---
---**⚠️ Prefer schema-managed entity references instead of this function.**
---@param id string|LuaEntity An entity ID string or a LuaEntity object.
---@return LuaEntity? entity The entity, or `nil` if not found.
function scene.getEntity(id) end

---Checks whether an entity with the given ID exists in the scene.
---
---**⚠️ Prefer `entity:isValid()` on managed references instead.**
---@param id string|LuaEntity An entity ID string or a LuaEntity object.
---@return boolean exists `true` if the entity exists.
function scene.exists(id) end
