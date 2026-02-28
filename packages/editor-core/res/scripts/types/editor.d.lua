---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Editor
--
-- The global Editor API table. Available ONLY to scripts running in the
-- Editor Plane (Meta-Plane). Used for powerful scene mutations,
-- custom tools, and session management.
-- ═══════════════════════════════════════════════════════════════════════

---The active editor session. Provides access to the scene and global state.
---@class EditorSession
local EditorSession = {}

---Returns the current status of the live game simulation.
---@return "stopped"|"playing"|"paused"
function EditorSession:getGameState() end

---Returns the unique identifier of the currently selected entity, or nil if nothing is selected.
---@return string|nil UUID of the selected entity.
function EditorSession:getSelectedEntityId() end

---Spawns a new entity in the active scene.
---@param parentId? string Optional UUID of the parent entity.
---@return DuckEntity
function EditorSession:createEntity(parentId) end

---Deletes an entity from the scene by its UUID.
---@param id string The UUID of the entity to delete.
function EditorSession:deleteEntity(id) end

---Retrieves an entity from the scene by its unique UUID string.
---@param id string The UUID of the entity.
---@return DuckEntity?
function EditorSession:getEntity(id) end

---Finds the first entity in the scene matching the given name or ID.
---@param name string The name or ID to search for.
---@return DuckEntity?
function EditorSession:findEntityByName(name) end

---API for managing and querying viewports in the editor.
---@class ViewportsAPI
---@field get fun(id: string): Viewport? Retrieves a specific viewport by its unique ID.
---@field getActiveId fun(): string? Returns the ID of the currently focused viewport.
---@field getActive fun(): Viewport? Returns the currently focused viewport instance.
---@field getAll fun(): Viewport[] Returns a list of all open viewports.
local ViewportsAPI = {}

---The global editor entry point. Provides access to sessions and viewports.
---@class EditorAPI
---@field session EditorSession Access to the active scene, selection, and game state.
---@field viewports ViewportsAPI Access to the editor's viewport management.
---@field findEntityByName fun(name: string): DuckEntity? @deprecated Use editor.session:findEntityByName(name)
---@field getEntity fun(id: string): DuckEntity? @deprecated Use editor.session:getEntity(id)
editor = {}

---@table __jsEditorApi
---Low-level JavaScript Bridge. DO NOT use directly in user scripts.
---Internal functions for communication between Lua and TypeScript.
__jsEditorApi = {}
