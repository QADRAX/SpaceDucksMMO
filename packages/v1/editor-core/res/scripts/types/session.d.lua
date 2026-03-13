---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Editor Session
-- ═══════════════════════════════════════════════════════════════════════

---@class DuckEntity
---@field displayName string The human-readable name of the entity (Editor Only).

---The active editor session. Provides access to the scene and global state.
---@class EditorSession
local EditorSession = {}

---@return "stopped"|"playing"|"paused"
function EditorSession:getGameState() end

---@return string|nil
function EditorSession:getSelectedEntityId() end

---@return DuckEntity|nil
function EditorSession:getSelectedEntity() end

---@param entityOrId string|DuckEntity|nil
function EditorSession:setSelectedEntity(entityOrId) end

---@param parentId? string
---@return DuckEntity
function EditorSession:createEntity(parentId) end

---@param entityOrId string|DuckEntity
function EditorSession:deleteEntity(entityOrId) end

---@param id string
---@return DuckEntity?
function EditorSession:getEntity(id) end

---@param name string
---@return DuckEntity?
function EditorSession:findEntityByName(name) end

---The global editor entry point.
---@class EditorAPI
---@field session EditorSession Access to the active scene, selection, and game state.
---@field viewports ViewportsAPI Access to the editor's viewport management.
---@field findEntityByName fun(name: string): DuckEntity? @deprecated Use editor.session:findEntityByName(name)
---@field getEntity fun(id: string): DuckEntity? @deprecated Use editor.session:getEntity(id)
editor = {}

---Low-level JavaScript Bridge. Internal use ONLY.
---@table __jsEditorApi
__jsEditorApi = {}
