-- ═══════════════════════════════════════════════════════════════════════
-- sandbox_security.lua — Environment Security & Script Constants
-- ═══════════════════════════════════════════════════════════════════════
-- LOAD ORDER: 1 of 4 (loaded first, before any other sandbox module)
--
-- PURPOSE:
--   1. Remove dangerous Lua standard-library globals so user scripts
--      cannot access the file system, debug hooks, or load arbitrary code.
--   2. Define the `Script` constant table that maps friendly names to
--      built-in script URIs (e.g. Script.MoveToPoint → "builtin://move_to_point.lua").
--
-- WHY A SEPARATE FILE:
--   Keeping security and constants isolated makes them easy to audit.
--   Nothing in this file depends on metatables, bridges, or Vec3.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Clear Dangerous Globals ──────────────────────────────────────
-- Lua's default environment includes modules that give full access to
-- the host file system and process.  We nil them out so user scripts
-- (which run inside this same Lua engine) can never reach them.

os       = nil   -- os.execute, os.remove, etc.
io       = nil   -- io.open, io.read, etc.
debug    = nil   -- debug.getinfo, debug.sethook, etc.
loadfile = nil   -- Load arbitrary Lua files from disk
dofile   = nil   -- Execute arbitrary Lua files from disk


-- ── 2. Script Reference Constants ───────────────────────────────────
-- The `Script` table lets user Lua code refer to engine-provided
-- scripts by name instead of raw URI strings.
--
-- USAGE IN LUA SCRIPTS:
--   -- Access a sibling script on the same entity:
--   local mtp = self.scripts[Script.MoveToPoint]
--   mtp.targetPoint = { 1, 2, 3 }
--
--   -- Reference a script by custom path:
--   local s = self.scripts[Script.project("my_ai")]

Script = {
    -- ── Core Movement & Camera ──────────────────────────────────────
    FirstPersonMove        = "builtin://first_person_move.lua",
    FirstPersonPhysicsMove = "builtin://first_person_physics_move.lua",
    FollowEntity           = "builtin://follow_entity.lua",
    FollowEntityPhysics    = "builtin://follow_entity_physics.lua",
    LookAtEntity           = "builtin://look_at_entity.lua",
    LookAtPoint            = "builtin://look_at_point.lua",
    MouseLook              = "builtin://mouse_look.lua",
    MoveToPoint            = "builtin://move_to_point.lua",
    OrbitCamera            = "builtin://orbit_camera.lua",
    SmoothFollow           = "builtin://smooth_follow.lua",
    SmoothLookAt           = "builtin://smooth_look_at.lua",

    -- ── Utility ─────────────────────────────────────────────────────
    Billboard              = "builtin://billboard.lua",
    RotateContinuous       = "builtin://rotate_continuous.lua",
    Bounce                 = "builtin://bounce.lua",
    WaypointPath           = "builtin://waypoint_path.lua",
    SpawnOnInterval        = "builtin://spawn_on_interval.lua",
    DestroyAfter           = "builtin://destroy_after.lua",

    -- ── Path Helpers ────────────────────────────────────────────────
    -- Generate URIs for editor or project scripts by name:
    --   Script.editor("my_tool")   → "editor://my_tool.lua"
    --   Script.project("my_logic") → "project://my_logic.lua"
    editor  = function(name) return "editor://" .. name .. ".lua" end,
    project = function(name) return "project://" .. name .. ".lua" end
}
