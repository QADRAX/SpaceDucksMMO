---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Viewport Plugins
-- Definitions for Viewport Controllers (Pilots) and Features (Gadgets).
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Viewport Controller (The "Pilot")
-- ───────────────────────────────────────────────────────────────────────

---A live instance of a Viewport Controller.
---@class ViewportControllerInstance<P, S>
---@field properties P Read-only access to the controller's property values defined in the schema.
---@field state S Persistent state table for this instance (cleared on reload).
---@field viewport Viewport A reference to the viewport this controller is managing.
---@field entities table<string, DuckEntity> Registry of subscene entities spawned by this controller.

---The static template for a Viewport Controller.
---@generic P, S
---@class ViewportControllerBlueprint<P, S>
---@field schema? SchemaDefinition Metadata and property definitions for the inspector.
---@field init? fun(self: ViewportControllerInstance<P, S>, ctx: ViewportContext) Called once when the viewport is created.
---@field onEnable? fun(self: ViewportControllerInstance<P, S>, ctx: ViewportContext) Called when the viewport becomes active or the script is reloaded.
---@field update? fun(self: ViewportControllerInstance<P, S>, dt: number, ctx: ViewportContext) Called every frame to handle logic and camera movement.
---@field onPropertyChanged? fun(self: ViewportControllerInstance<P, S>, props: P, prevProps: P, ctx: ViewportContext) Called when properties change via the UI.
---@field onDestroy? fun(self: ViewportControllerInstance<P, S>, ctx: ViewportContext) Called when the viewport is deleted.

---Standard export type for a Viewport Controller script.
---@alias ViewportControllerModule<P, S> ViewportControllerBlueprint<P, S>

-- ───────────────────────────────────────────────────────────────────────
-- Viewport Feature (The "Gadgets")
-- ───────────────────────────────────────────────────────────────────────

---A live instance of a Viewport Feature addon.
---@class ViewportFeatureInstance<P, S>
---@field properties P Read-only access to the feature's defined properties.
---@field state S Persistent state table for this feature instance.
---@field viewport Viewport The viewport this feature is currently attached to.

---The static template for a Viewport Feature addon.
---@generic P, S
---@class ViewportFeatureBlueprint<P, S>
---@field schema? SchemaDefinition Metadata and configuration schema for the addon.
---@field onEnable? fun(self: ViewportFeatureInstance<P, S>, ctx: ViewportContext): (fun()|nil) Called when attached. Returns optional cleanup fun.
---@field update? fun(self: ViewportFeatureInstance<P, S>, dt: number, ctx: ViewportContext) Called every frame.
---@field onPropertyChanged? fun(self: ViewportFeatureInstance<P, S>, props: P, prevProps: P, ctx: ViewportContext) Called when properties are updated.
---@field getUI? fun(self: ViewportFeatureInstance<P, S>, ctx: ViewportContext): ViewportUIContribution|nil Returns UI elements to render on the viewport overlay.
---@field onPointerDown? fun(self: ViewportFeatureInstance<P, S>, ev: any, ctx: ViewportContext): boolean|nil Handle mouse clicks. Return true to consume.
---@field onPointerMove? fun(self: ViewportFeatureInstance<P, S>, ev: any, ctx: ViewportContext) Handle mouse movement.
---@field onPointerUp? fun(self: ViewportFeatureInstance<P, S>, ev: any, ctx: ViewportContext) Handle mouse release.

---Standard export type for a Viewport Feature script.
---@alias ViewportFeatureModule<P, S> ViewportFeatureBlueprint<P, S>

-- ───────────────────────────────────────────────────────────────────────
-- Viewport Base Types
-- ───────────────────────────────────────────────────────────────────────

---A UI contribution from a feature to the viewport's overlay or toolbar.
---@class ViewportUIContribution
---@field slot string E.g., "viewport:overlay:top-left", "viewport:toolbar:right".
---@field descriptor UIElementDescriptor The UI layout metadata.
