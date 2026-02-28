---@type EditorExtensionModule
local plugin = {
    meta = {
        id = "builtin:entity-actions",
        displayName = "Entity Actions",
        description = "Keyboard shortcuts and toolbar buttons for common entity operations.",
        icon = "⌨",
        category = "actions",
        configFields = {
            {
                key = "shortcutDuplicate",
                label = "Duplicate entity",
                type = "shortcut",
                defaultValue = "ctrl+d"
            },
            {
                key = "shortcutDelete",
                label = "Delete entity",
                type = "shortcut",
                defaultValue = "delete"
            },
            {
                key = "shortcutFocus",
                label = "Focus camera on selection",
                type = "shortcut",
                defaultValue = "f"
            }
        }
    },

    slotFills = {
        {
            slot = "hierarchy.header-actions",
            priority = 0,
            ui = function(ctx)
                return {
                    type = "button",
                    props = {
                        title = "Duplicate (Ctrl+D)",
                        icon = "copy",
                        onClick = function()
                            ctx.duplicateSelectedEntity()
                        end,
                        disabled = ctx.selectedEntityId == nil
                    }
                }
            end
        }
    },

    onEnable = function(ctx)
        -- Registration of shortcuts
        local stopDuplicate = ctx.onKeyDown("ctrl+d", function()
            ctx.duplicateSelectedEntity()
        end)

        local stopDelete = ctx.onKeyDown("delete", function()
            ctx.deleteSelectedEntity()
        end)

        return function()
            stopDuplicate()
            stopDelete()
        end
    end
}

return plugin
