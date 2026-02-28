---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Editor Plugins
-- Types and interfaces for writing Editor Plugins in Lua.
-- Plugins are evaluated at editor load time and must return a table
-- matching the EditorPluginModule interface.
-- ═══════════════════════════════════════════════════════════════════════

---@class EditorPluginConfigField
---@field key string
---@field label string
---@field description? string
---@field type 'boolean' | 'number' | 'string' | 'color' | 'select' | 'shortcut'
---@field defaultValue any
---@field min? number
---@field max? number
---@field step? number
---@field unit? string
---@field options? {value: string, label: string}[]

---@class EditorPluginMeta
---@field id string
---@field displayName string
---@field description? string
---@field icon? string
---@field category 'visualization' | 'actions' | 'panels' | 'scripting'
---@field configFields? EditorPluginConfigField[]

---@class UIElementDescriptor
---@field type 'button' | 'toggle' | 'label' | 'row' | 'column'
---@field props table<string, any>
---@field children? UIElementDescriptor[]

---@class EditorSlotFill
---@field slot 'toolbar.debug-actions' | 'hierarchy.header-actions' | 'hierarchy.footer' | 'inspector.after-transform' | 'inspector.after-components' | 'bottom-tab'
---@field priority? number
---@field tabLabel? string
---@field ui fun(ctx: EditorPluginContext): UIElementDescriptor | UIElementDescriptor[]

---@class EditorPluginContext
---@field selectedEntityId? string
---@field gameState 'stopped' | 'playing' | 'paused'
---@field createEntity fun(parentId?: string)
---@field deleteSelectedEntity fun()
---@field duplicateSelectedEntity fun()
---@field setSelectedEntity fun(id: string)
---@field reparentEntity fun(childId: string, newParentId: string)
---@field setError fun(msg: string)
---@field setConfig fun(key: string, value: any)
---@field onKeyDown fun(shortcut: string, handler: fun()): fun()

---@class EditorPluginModule
---@field meta EditorPluginMeta
---@field slotFills? EditorSlotFill[]
---@field onEnable? fun(ctx: EditorPluginContext): (fun() | nil)
---@field onTick? fun(dt: number, ctx: EditorPluginContext)
---@field onSelectionChanged? fun(ids: string[], ctx: EditorPluginContext)
---@field onGameStateChanged? fun(state: 'stopped' | 'playing' | 'paused', ctx: EditorPluginContext)
---@field onConfigChanged? fun(key: string, value: any, ctx: EditorPluginContext)

---@type EditorPluginModule
local plugin = {
    meta = {
        id = "example-plugin",
        displayName = "Example",
        category = "actions"
    }
}
return plugin
