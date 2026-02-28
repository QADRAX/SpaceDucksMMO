---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Viewports
-- Type definitions for Viewport Controllers and Features.
-- ═══════════════════════════════════════════════════════════════════════

---@class EditorSession
---@class ViewportContext
---@field viewport Viewport The viewport instance this script is running in.
---@field session EditorSession Global editor session API.

-- ───────────────────────────────────────────────────────────────────────
-- Viewport Controller (The "Pilot")
-- ───────────────────────────────────────────────────────────────────────

---@class ViewportControllerInstance<P, S>
---@field properties P Read-only access to the controller's inspector properties.
---@field state S Persistent state table.
---@field viewport Viewport The viewport this instance belongs to.
---@field entities table<string, DuckEntity> Managed subscene entities registered by this controller.

---@generic P, S
---@class ViewportControllerBlueprint<P, S>
---@field schema? SchemaDefinition Metadata and property definitions.
---@field init? fun(self: ViewportControllerInstance<P, S>, ctx: ViewportContext) Called once when the viewport is initialized.
---@field onEnable? fun(self: ViewportControllerInstance<P, S>, ctx: ViewportContext) Called when the controller becomes active.
---@field update? fun(self: ViewportControllerInstance<P, S>, dt: number, ctx: ViewportContext) Called every frame.
---@field onPropertyChanged? fun(self: ViewportControllerInstance<P, S>, props: P, prevProps: P, ctx: ViewportContext) Called when properties change.
---@field onDestroy? fun(self: ViewportControllerInstance<P, S>, ctx: ViewportContext) Called when the viewport is destroyed.

---@alias ViewportControllerModule<P, S> ViewportControllerBlueprint<P, S>

-- ───────────────────────────────────────────────────────────────────────
-- Viewport Feature (The "Gadgets")
-- ───────────────────────────────────────────────────────────────────────

---@class ViewportFeatureInstance<P, S>
---@field properties P Read-only access to the feature's properties.
---@field state S Persistent state table.
---@field viewport Viewport The viewport this feature is attached to.

---@generic P, S
---@class ViewportFeatureBlueprint<P, S>
---@field schema? SchemaDefinition Metadata and property definitions.
---@field onEnable? fun(self: ViewportFeatureInstance<P, S>, ctx: ViewportContext): (fun()|nil)
---@field update? fun(self: ViewportFeatureInstance<P, S>, dt: number, ctx: ViewportContext)
---@field onPropertyChanged? fun(self: ViewportFeatureInstance<P, S>, props: P, prevProps: P, ctx: ViewportContext)
---@field getUI? fun(self: ViewportFeatureInstance<P, S>, ctx: ViewportContext): ViewportUIContribution|nil
---@field onPointerDown? fun(self: ViewportFeatureInstance<P, S>, ev: any, ctx: ViewportContext): boolean|nil
---@field onPointerMove? fun(self: ViewportFeatureInstance<P, S>, ev: any, ctx: ViewportContext)
---@field onPointerUp? fun(self: ViewportFeatureInstance<P, S>, ev: any, ctx: ViewportContext)

---@alias ViewportFeatureModule<P, S> ViewportFeatureBlueprint<P, S>

-- ───────────────────────────────────────────────────────────────────────
-- Viewport Base Types
-- ───────────────────────────────────────────────────────────────────────

---@class ViewportUIContribution
---@field slot string E.g. "viewport:overlay:top-left", "viewport:toolbar:right"
---@field descriptor UIElementDescriptor

---@class Viewport
---@field id string
---@field cameraEntityId string|nil The active camera entity for this viewport.
local Viewport = {}

---Spawns an editor-only entity in this viewport's scene.
---@param baseName string
---@param registryKey? string Optional key to register the entity into `self.entities[key]`.
---@return DuckEntity
function Viewport:spawnEntity(baseName, registryKey) end

---Updates an internal property of the controller.
---@param key string
---@param value any
function Viewport:setProperty(key, value) end
