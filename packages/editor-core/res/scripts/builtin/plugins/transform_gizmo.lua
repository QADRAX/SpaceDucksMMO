---@type EditorExtensionModule
local plugin = {
    meta = {
        id = "builtin:transform-gizmo",
        displayName = "Transform Gizmo",
        description = "Configures the XYZ transform handles for selected entities.",
        icon = "✜",
        category = "visualization",
        configFields = {
            {
                key = "mode",
                label = "Mode",
                type = "select",
                defaultValue = "translate",
                options = {
                    { value = "translate", label = "Translate" },
                    { value = "rotate",    label = "Rotate" },
                    { value = "scale",     label = "Scale" }
                }
            },
            {
                key = "space",
                label = "Space",
                type = "select",
                defaultValue = "local",
                options = {
                    { value = "local", label = "Local" },
                    { value = "world", label = "World" }
                }
            }
        }
    },

    slotFills = {
        {
            slot = "inspector.after-transform",
            priority = 0,
            ui = function(ctx)
                -- The config itself is rendered by the Plugin configurator,
                -- but we can add quick toggles here
                return editor.ui.row({
                    editor.ui.label("Shortcuts:"),
                    editor.ui.button("T", {
                        title = "Translate (T)",
                        onClick = function()
                            ctx.setConfig("mode", "translate")
                        end
                    }),
                    editor.ui.button("R", {
                        title = "Rotate (R)",
                        onClick = function()
                            -- setConfig("mode", "rotate")
                        end
                    }),
                    editor.ui.button("S", {
                        title = "Scale (S)",
                        onClick = function()
                            -- setConfig("mode", "scale")
                        end
                    }),
                })
            end
        }
    },

    onEnable = function(ctx)
        -- Shortcuts to switch modes
        -- The actual gizmo rendering reads the plugin config from the registry on the TS side.
        return function() end
    end
}

return plugin
