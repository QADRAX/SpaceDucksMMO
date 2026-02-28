---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Editor
-- The global Editor API table. Available ONLY to scripts running in the
-- Editor Plane (Meta-Plane). Used for powerful scene mutations,
-- custom tools, and session management.
-- ═══════════════════════════════════════════════════════════════════════

---@class EditorSession
local EditorSession = {}

---@return "stopped"|"playing"|"paused"
function EditorSession:getGameState() end

---@return string|nil UUID of the selected entity.
function EditorSession:getSelectedEntityId() end

---Spawns a new entity in the active scene.
---@param parentId? string Optional parent UUID.
---@return DuckEntity
function EditorSession:createEntity(parentId) end

---Deletes an entity by its UUID.
---@param id string
function EditorSession:deleteEntity(id) end

---Retrieves an entity by its unique UUID string.
---@param id string
---@return DuckEntity?
function EditorSession:getEntity(id) end

---@class ViewportsAPI
---@field get fun(id: string): Viewport?
---@field getActiveId fun(): string?
---@field getActive fun(): Viewport?
---@field getAll fun(): Viewport[]
local ViewportsAPI = {}

---@class EditorAPI
---@field session EditorSession The active editor session.
---@field viewports ViewportsAPI Viewport management API.
---@field findEntityByName fun(name: string): DuckEntity?
---@field getEntity fun(id: string): DuckEntity? @deprecated Use editor.session:getEntity(id)
editor = {}

---@table __jsEditorApi
---Low-level JS Bridge. Internal use ONLY.
__jsEditorApi = {}
