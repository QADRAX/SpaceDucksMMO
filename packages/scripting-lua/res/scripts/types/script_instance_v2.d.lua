---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Script Instance
-- Script lifecycle hooks and instance properties.
-- ═══════════════════════════════════════════════════════════════════════

---Script instance self parameter (passed to all lifecycle hooks).
---@class ScriptInstanceV2
---@field id string Entity ID this script is attached to.
---@field state table Persistent state object for storing variables per instance.
---@field properties table Read-only properties synced from the ECS.
local ScriptInstanceV2 = {}

---Lifecycle hook: Called once on script initialization.
---@param self ScriptInstanceV2
function ScriptInstanceV2:init() end

---Lifecycle hook: Called when script/entity becomes enabled.
---@param self ScriptInstanceV2
function ScriptInstanceV2:onEnable() end

---Lifecycle hook: First update of the frame (before physics).
---@param self ScriptInstanceV2
---@param dt number Delta time in seconds.
function ScriptInstanceV2:earlyUpdate(dt) end

---Lifecycle hook: Main update of the frame.
---@param self ScriptInstanceV2
---@param dt number Delta time in seconds.
function ScriptInstanceV2:update(dt) end

---Lifecycle hook: Last update of the frame (after physics).
---@param self ScriptInstanceV2
---@param dt number Delta time in seconds.
function ScriptInstanceV2:lateUpdate(dt) end

---Lifecycle hook: Called during debug gizmo drawing phase.
---@param self ScriptInstanceV2
function ScriptInstanceV2:onDrawGizmos() end

---Lifecycle hook: Called when a collision begins.
---@param self ScriptInstanceV2
---@param ... any Collision data (entity, normal, etc.).
function ScriptInstanceV2:onCollisionEnter(...) end

---Lifecycle hook: Called when a collision ends.
---@param self ScriptInstanceV2
---@param ... any Collision data.
function ScriptInstanceV2:onCollisionExit(...) end

---Lifecycle hook: Called when a property changes (synced from ECS).
---@param self ScriptInstanceV2
---@param key string Property key that changed.
---@param newValue any New property value.
function ScriptInstanceV2:onPropertyChanged(key, newValue) end

---Lifecycle hook: Called when script/entity becomes disabled.
---@param self ScriptInstanceV2
function ScriptInstanceV2:onDisable() end

---Lifecycle hook: Called when script is destroyed.
---@param self ScriptInstanceV2
function ScriptInstanceV2:onDestroy() end
