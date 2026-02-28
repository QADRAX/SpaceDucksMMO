return {
    meta = {
        id = "builtin:test-panel",
        displayName = "Test Panel",
        category = "panels"
    },
    slotFills = {
        {
            slot = "bottom-tab",
            tabLabel = "Test Tab",
            priority = 1,
            ui = function(ctx)
                return editor.ui.row({
                    editor.ui.label("Hello from built-in Editor core script!")
                })
            end
        }
    }
}
