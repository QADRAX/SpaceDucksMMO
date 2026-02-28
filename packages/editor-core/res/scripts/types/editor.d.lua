---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Editor
-- The global Editor API table. Available ONLY to scripts running in the
-- Editor Plane (Meta-Plane). Used for powerful scene mutations,
-- custom tools, and inspector extensions.
-- ═══════════════════════════════════════════════════════════════════════

---@class EditorAPI
---The global editor API table.
editor = {}

---@table __jsEditorApi
---Low-level JS Bridge. Internal use ONLY.
__jsEditorApi = {}

-- ─── Scene Queries (Restricted in Game Mode) ────────────────────────

---Finds the first entity in the scene matching the given name.
---Note: This is an expensive O(N) operation and shouldn't be used in tight loops.
---@param name string The name or displayName of the entity to find.
---@return DuckEntity? entity The found entity, or `nil` if not found.
function editor.findEntityByName(name) end

---Retrieves an entity by its unique UUID string.
---@param id string The UUID of the entity.
---@return DuckEntity? entity The found entity, or `nil` if not found.
function editor.getEntity(id) end

---Checks if an entity with the given ID still exists in the active scene.
---@param id string The UUID of the entity.
---@return boolean exists `true` if the entity exists.
function editor.exists(id) end
