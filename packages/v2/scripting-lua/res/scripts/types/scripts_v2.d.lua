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
    LookAtPoint = "builtin://look_at_point.lua",
    RotateContinuous = "builtin://rotate_continuous.lua",
    Bounce = "builtin://bounce.lua",
    DestroyAfter = "builtin://destroy_after.lua",
    Billboard = "builtin://billboard.lua",
    LookAtEntity = "builtin://look_at_entity.lua",
    SpawnOnInterval = "builtin://spawn_on_interval.lua",
    FollowEntity = "builtin://follow_entity.lua",
    SmoothFollow = "builtin://smooth_follow.lua",
    SmoothLookAt = "builtin://smooth_look_at.lua",
    OrbitCamera = "builtin://orbit_camera.lua",
    FirstPersonMove = "builtin://first_person_move.lua",
}
