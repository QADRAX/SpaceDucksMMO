-- ═══════════════════════════════════════════════════════════════════════
-- Editor Sandbox Initialization Script
-- ═══════════════════════════════════════════════════════════════════════

editor = editor or {}
editor.ui = editor.ui or {}

-- Editor UI Descriptor Builders
editor.ui.button = function(text, props)
    local p = props or {}
    p.text = text
    return { type = "button", props = p }
end

editor.ui.toggle = function(label, props)
    local p = props or {}
    p.label = label
    return { type = "toggle", props = p }
end

editor.ui.label = function(text)
    return { type = "label", props = { text = text } }
end

editor.ui.row = function(children)
    return { type = "row", children = children }
end

editor.ui.column = function(children)
    return { type = "column", children = children }
end
