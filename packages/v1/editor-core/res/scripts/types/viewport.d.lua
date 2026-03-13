---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Viewports
-- ═══════════════════════════════════════════════════════════════════════

---The context provided to all viewport-related lifecycle hooks.
---@class ViewportContext
---@field viewport Viewport The viewport instance this script is running in.
---@field session EditorSession Global editor session API (scene, selection, state).

---API for managing and querying viewports.
---@class ViewportsAPI
---@field get fun(id: string): Viewport? Retrieves a specific viewport by its unique ID.
---@field getActiveId fun(): string? Returns the ID of the currently focused viewport.
---@field getActive fun(): Viewport? Returns the currently focused viewport instance.
---@field getAll fun(): Viewport[] Returns a list of all open viewports.

---A visual window into a scene.
---@class Viewport
---@field id string Unique ID of the viewport instance.
---@field cameraEntityId string|nil The UUID of the camera entity currently "filming" this viewport.
local Viewport = {}

---@param baseName string
---@param registryKey? string
---@return DuckEntity
function Viewport:spawnEntity(baseName, registryKey) end

---@param key string
---@param value any
function Viewport:setProperty(key, value) end
