---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Editor Extensions
-- Types and interfaces for writing Editor Extensions (global tools) in Lua.
-- Extensions are evaluated at editor load time and must return a table
-- matching the EditorExtensionModule interface.
-- ═══════════════════════════════════════════════════════════════════════

---@class EditorExtensionConfigField
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

---@class EditorExtensionMeta
---@field id string
---@field displayName string
---@field description? string
---@field icon? string
---@field category 'visualization' | 'actions' | 'panels' | 'scripting'
---@field configFields? EditorExtensionConfigField[]

---@class UIElementDescriptor
---@field type 'button' | 'toggle' | 'label' | 'row' | 'column'
---@field props table<string, any>
---@field children? UIElementDescriptor[]

---@class EditorSlotFill
---@field slot 'toolbar.debug-actions' | 'hierarchy.header-actions' | 'hierarchy.footer' | 'inspector.after-transform' | 'inspector.after-components' | 'bottom-tab'
---@field priority? number
---@field tabLabel? string
---@field ui fun(ctx: EditorExtensionContext): UIElementDescriptor | UIElementDescriptor[]

---@class EditorExtensionContext
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

---@class EditorExtensionModule
---@field meta EditorExtensionMeta
---@field slotFills? EditorSlotFill[]
---@field onEnable? fun(ctx: EditorExtensionContext): (fun() | nil)
---@field onTick? fun(dt: number, ctx: EditorExtensionContext)
---@field onSelectionChanged? fun(ids: string[], ctx: EditorExtensionContext)
---@field onGameStateChanged? fun(state: 'stopped' | 'playing' | 'paused', ctx: EditorExtensionContext)
---@field onConfigChanged? fun(key: string, value: any, ctx: EditorExtensionContext)

---@type EditorExtensionModule
local extension = {
    meta = {
        id = "example-extension",
        displayName = "Example Extension",
        category = "actions"
    }
}
return extension
