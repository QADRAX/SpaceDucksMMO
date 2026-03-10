---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Scripts
-- Script properties manipulation.
-- ═══════════════════════════════════════════════════════════════════════

---@class ScriptsV2
local ScriptsV2 = {}

---Sets a property value of another script on the same entity.
---@param scriptId string Script ID (e.g. BuiltInScripts.MoveToPoint or 'my_custom_script')
---@param propertyName string The property to configure
---@param value any The property value
function ScriptsV2.setProperty(scriptId, propertyName, value)
end

---Enum of built-in script names.
---@enum BuiltInScripts
BuiltInScripts = {
    MoveToPoint = "builtin://move_to_point.lua",
    WaypointPath = "builtin://waypoint_path.lua",
}
