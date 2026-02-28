---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Editor Viewports
-- Type definitions for Viewport Scripts and UI Plugins.
-- ═══════════════════════════════════════════════════════════════════════

---@class ViewportContext
---@field viewport EditorViewport The viewport instance this script is running in.
---@field engine EditorAPI Global editor plane API.
---@field setConfig fun(key: string, value: any) Update a plugin configuration value.

-- ───────────────────────────────────────────────────────────────────────
-- Viewport Script (Logic & Subscene)
-- ───────────────────────────────────────────────────────────────────────

---@class ViewportScriptInstance<P, S>
---@field properties P Read-only access to the script's inspector properties.
---@field state S Persistent state table.
---@field viewport EditorViewport The viewport this instance belongs to.
---@field entities table<string, DuckEntity> Managed subscene entities registered by this script.

---@generic P, S
---@class ViewportScriptBlueprint<P, S>
---@field schema? SchemaDefinition Metadata and property definitions.
---@field init? fun(self: ViewportScriptInstance<P, S>, ctx: ViewportContext) Called once when the viewport is created.
---@field onEnable? fun(self: ViewportScriptInstance<P, S>, ctx: ViewportContext) Called when the viewport becomes active.
---@field update? fun(self: ViewportScriptInstance<P, S>, dt: number, ctx: ViewportContext) Called every frame.
---@field onPropertyChanged? fun(self: ViewportScriptInstance<P, S>, props: P, prevProps: P, ctx: ViewportContext) Called when properties change.
---@field onDisable? fun(self: ViewportScriptInstance<P, S>, ctx: ViewportContext) Called when the viewport is deactivated.
---@field onDestroy? fun(self: ViewportScriptInstance<P, S>, ctx: ViewportContext) Called when the viewport is destroyed.

---@alias ViewportModule<P, S> ViewportScriptBlueprint<P, S>

-- ───────────────────────────────────────────────────────────────────────
-- Viewport UI Plugin (UI & Shared Logic)
-- ───────────────────────────────────────────────────────────────────────

---@class ViewportPluginInstance<P, S>
---@field properties P Read-only access to the plugin's properties.
---@field state S Persistent state table.
---@field viewport EditorViewport The viewport this plugin is registered to.
---@field entities table<string, DuckEntity> Managed subscene entities.

---@generic P, S
---@class ViewportPluginBlueprint<P, S>
---@field schema? SchemaDefinition Metadata and property definitions.
---@field onEnable? fun(self: ViewportPluginInstance<P, S>, ctx: ViewportContext): (fun()|nil)
---@field update? fun(self: ViewportPluginInstance<P, S>, dt: number, ctx: ViewportContext)
---@field onPropertyChanged? fun(self: ViewportPluginInstance<P, S>, props: P, prevProps: P, ctx: ViewportContext)
---@field getUI? fun(self: ViewportPluginInstance<P, S>, ctx: ViewportContext): ViewportUIContribution[]|nil
---@field onPointerDown? fun(self: ViewportPluginInstance<P, S>, ev: any, ctx: ViewportContext): boolean|nil
---@field onPointerMove? fun(self: ViewportPluginInstance<P, S>, ev: any, ctx: ViewportContext)
---@field onPointerUp? fun(self: ViewportPluginInstance<P, S>, ev: any, ctx: ViewportContext)

---@alias ViewportPluginModule<P, S> ViewportPluginBlueprint<P, S>

-- ───────────────────────────────────────────────────────────────────────
-- Viewport Base Types
-- ───────────────────────────────────────────────────────────────────────

---@class ViewportUIContribution
---@field slot "toolbar"|"overlay"
---@field descriptor UIElementDescriptor|UIElementDescriptor[]

---@class EditorViewport
---@field id string
---@field type "game"|"scene"|"custom"
---@field cameraEntityId string|nil The active camera entity for this viewport.
local EditorViewport = {}

---Spawns an editor-only entity in this viewport's scene.
---@param baseName string
---@param registryKey? string Optional key to register the entity into `self.entities[key]`.
---@return DuckEntity
function EditorViewport:spawnEntity(baseName, registryKey) end

---Registers a UI plugin for this viewport.
---@param plugin any
function EditorViewport:registerPlugin(plugin) end

---Sets the main logic script for this viewport.
---@param blueprint any
function EditorViewport:setScript(blueprint) end
