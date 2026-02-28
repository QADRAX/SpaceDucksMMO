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

-- Editor Viewports API
editor.viewports = editor.viewports or {}

-- ═══════════════════════════════════════════════════════════════════════
-- Entity Metatable for Editor-Core
-- Mimics core behavior but focused on editor-specific property access.
-- ═══════════════════════════════════════════════════════════════════════
__EntityMT = {
    __index = function(t, k)
        if k == "id" then return t.__id end
        -- Attempt to get specialized editor property
        return __jsEditorApi.getEntityProperty(t.__id, k)
    end,
    __newindex = function(t, k, v)
        __jsEditorApi.setEntityProperty(t.__id, k, v)
    end
}

function __WrapEntity(id)
    if not id or id == "" then return nil end
    local e = { __id = id }
    setmetatable(e, __EntityMT)
    return e
end

-- ═══════════════════════════════════════════════════════════════════════
-- JS Bridge Mapping
-- Maps the low-level __jsEditorApi into the user-friendly editor table.
-- ═══════════════════════════════════════════════════════════════════════
if __jsEditorApi then
    -- Scene Query Bridge
    editor.findEntityByName = __jsEditorApi.findEntityByName
    editor.getEntity = __jsEditorApi.getEntity
    editor.exists = __jsEditorApi.exists

    -- Viewports Bridge
    editor.viewports = editor.viewports or {}
    editor.viewports.getActiveId = __jsEditorApi.viewports.getActiveId
    editor.viewports.spawnEditorEntity = function(baseName)
        local id = __jsEditorApi.viewports.spawnEditorEntity(baseName)
        return __WrapEntity(id)
    end
end
