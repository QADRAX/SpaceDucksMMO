---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Script Instance
-- Script lifecycle hooks and instance properties.
-- ═══════════════════════════════════════════════════════════════════════

---Script instance self parameter (passed to all lifecycle hooks).
---@class ScriptInstanceV2
---@field id string Unique instance ID of this script component.
---@field state table Persistent state object for storing variables per instance.
---@field properties table Read-write properties synced with ECS (read from schema, writes flush back).
---@field entity EntityWrapperV2 Wrapper for the entity owning this script.
---@field references table<string, EntityWrapperV2 | EntityWrapperV2[] | any> Resolved references from schema properties.
---@field schema table Schema definition for the script properties.
---@field Transform TransformV2? Entity transform. Per-entity.
---@field Scene SceneV2? Scene access. Per-entity.
---@field Script ScriptsV2? Entity script component. Per-entity.
---@field Component ComponentV2? Generic component field access. Per-entity.
local ScriptInstanceV2 = {}

---Generic alias for strong typing property and state records in user scripts.
---@class ScriptInstance<TProps, TState> : ScriptInstanceV2
---@field properties TProps
---@field state TState
---@field entity EntityWrapperV2
---@field references table<string, EntityWrapperV2 | EntityWrapperV2[] | any>
local ScriptInstance = {}

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
