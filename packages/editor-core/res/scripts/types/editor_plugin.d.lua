---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Editor Extensions
--
-- Types and interfaces for writing Editor Extensions (global tools) in Lua.
-- Extensions are evaluated at editor load time and must return a table
-- matching the EditorExtensionModule interface.
-- ═══════════════════════════════════════════════════════════════════════

---A configurable field in the extension's inspector.
---@class EditorExtensionConfigField
---@field key string The unique key for this configuration field.
---@field label string The human-readable label shown in the UI.
---@field description? string Optional help text for the user.
---@field type 'boolean' | 'number' | 'string' | 'color' | 'select' | 'shortcut' The data type of the field.
---@field defaultValue any The initial value of the field.
---@field min? number Minimum value for numerical fields.
---@field max? number Maximum value for numerical fields.
---@field step? number Step increment for numerical sliders.
---@field unit? string Suffix (e.g., "px", "%") shown in the UI.
---@field options? {value: string, label: string}[] Options for 'select' type fields.

---Static metadata for an editor extension.
---@class EditorExtensionMeta
---@field id string Unique identifier for the extension (e.g., "my-tool").
---@field displayName string Human-readable name shown in menus and tabs.
---@field description? string Brief summary of what this tool does.
---@field icon? string Optional emoji or icon identifier for UI buttons.
---@field category 'visualization' | 'actions' | 'panels' | 'scripting' Groups related tools.
---@field configFields? EditorExtensionConfigField[] Definitions for the tool's inspector settings.

---A declarative description of a UI element for slot-based composition.
---@class UIElementDescriptor
---@field type 'button' | 'toggle' | 'label' | 'row' | 'column' The type of UI component.
---@field props table<string, any> Properties/attributes for the component (e.g., text, onClick).
---@field children? UIElementDescriptor[] Optional nested elements for containers.

---Defines where and how a UI element should be injected into the editor shell.
---@class EditorSlotFill
---@field slot 'toolbar.debug-actions' | 'hierarchy.header-actions' | 'hierarchy.footer' | 'inspector.after-transform' | 'inspector.after-components' | 'bottom-tab' The specific UI slot to fill.
---@field priority? number Order of rendering within the slot (lower is first).
---@field tabLabel? string Label for the tab (only used for 'bottom-tab' slot).
---@field ui fun(ctx: EditorExtensionContext): UIElementDescriptor | UIElementDescriptor[] Function returning the UI descriptor.

---The shared context provided to extension callbacks.
---@class EditorExtensionContext
---@field selectedEntityId? string ID of the currently selected entity, if any.
---@field gameState 'stopped' | 'playing' | 'paused' Current state of the game engine.
---@field createEntity fun(parentId?: string) Spawns a new entity in the active scene.
---@field deleteSelectedEntity fun() Deletes the current selection.
---@field duplicateSelectedEntity fun() Duplicates the current selection.
---@field setSelectedEntity fun(id: string) Updates the global editor selection.
---@field reparentEntity fun(childId: string, newParentId: string) Moves an entity in the hierarchy.
---@field setError fun(msg: string) Displays an error message in the editor UI.
---@field setConfig fun(key: string, value: any) Programmatically updates one of this extension's settings.
---@field onKeyDown fun(shortcut: string, handler: fun()): fun() Registers a global shortcut. Returns an unregister function.

---The root module structure for a global editor extension.
---@class EditorExtensionModule
---@field meta EditorExtensionMeta Metadata and configuration schema.
---@field slotFills? EditorSlotFill[] Custom UI elements to inject into editor slots.
---@field onEnable? fun(ctx: EditorExtensionContext): (fun() | nil) Called once when loaded. Returns an optional cleanup function.
---@field onTick? fun(dt: number, ctx: EditorExtensionContext) Called every frame while the extension is active.
---@field onSelectionChanged? fun(ids: string[], ctx: EditorExtensionContext) Called when the user clicks an entity.
---@field onGameStateChanged? fun(state: 'stopped' | 'playing' | 'paused', ctx: EditorExtensionContext) Called when play/stop is toggled.
---@field onConfigChanged? fun(key: string, value: any, ctx: EditorExtensionContext) Called when a user changes an inspector setting.

---Example Extension Module (Internal Reference)
---@type EditorExtensionModule
local extension = {
    meta = {
        id = "example-extension",
        displayName = "Example Extension",
        category = "actions"
    }
}
return extension
