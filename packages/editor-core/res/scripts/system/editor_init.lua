---@diagnostic disable: undefined-global
-- ═══════════════════════════════════════════════════════════════════════
-- Editor Sandbox Initialization Script
-- ═══════════════════════════════════════════════════════════════════════

math.clamp = function(v, min, max)
    return math.max(min, math.min(max, v))
end

-- Global Editor Table
editor = editor or {}

-- Editor UI Descriptor Builders
editor.ui = editor.ui or {}
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

-- ═══════════════════════════════════════════════════════════════════════
-- Entity Metatable
-- ═══════════════════════════════════════════════════════════════════════
__EntityMT = {
    __index = function(t, k)
        if k == "id" then return t.__id end
        -- Map to JS bridge properties/methods
        local val = __jsEditorApi.getEntityProperty(t.__id, k)
        if val ~= nil then return val end
        return nil
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
-- Session API
-- ═══════════════════════════════════════════════════════════════════════
editor.session = {}
function editor.session:getGameState() return __jsEditorApi.gameState() end

function editor.session:getSelectedEntityId() return __jsEditorApi.selectedEntityId() end

function editor.session:createEntity(parentId)
    return __WrapEntity(__jsEditorApi.createEntity(parentId))
end

function editor.session:deleteEntity(id) return __jsEditorApi.deleteEntity(id) end

function editor.session:getEntity(id) return __WrapEntity(__jsEditorApi.getEntity(id)) end

function editor.session:findEntityByName(name) return __WrapEntity(__jsEditorApi.findEntityByName(name)) end

-- ═══════════════════════════════════════════════════════════════════════
-- Viewport API
-- ═══════════════════════════════════════════════════════════════════════
editor.viewports = {}

__ViewportMT = {
    __index = function(t, k)
        if k == "id" then return t.__id end
        if k == "spawnEntity" then
            return function(self, baseName, registryKey)
                local id = __jsEditorApi.viewports.spawnEditorEntity(self.__id, baseName)
                local ent = __WrapEntity(id)
                if registryKey and ent then
                    __jsEditorApi.viewports.registerManagedEntity(self.__id, registryKey, id)
                end
                return ent
            end
        end
        if k == "setProperty" then
            return function(self, key, value)
                __jsEditorApi.viewports.setProperty(self.__id, key, value)
            end
        end
        if k == "getManagedEntity" then
            return function(self, key)
                local id = __jsEditorApi.viewports.getManagedEntity(self.__id, key)
                return __WrapEntity(id)
            end
        end
    end
}

function __WrapViewport(id)
    if not id then return nil end
    local vp = { __id = id }
    setmetatable(vp, __ViewportMT)
    return vp
end

editor.viewports.get = function(id) return __WrapViewport(id) end
editor.viewports.getActiveId = function() return __jsEditorApi.viewports.getActiveId() end
editor.viewports.getActive = function()
    local id = editor.viewports.getActiveId()
    return id and __WrapViewport(id) or nil
end
editor.viewports.getAll = function()
    local ids = __jsEditorApi.viewports.getAll()
    local res = {}
    for i, v in ipairs(ids) do res[i] = __WrapViewport(v.id) end
    return res
end

-- ═══════════════════════════════════════════════════════════════════════
-- Context & Lifecycle
-- ═══════════════════════════════════════════════════════════════════════
function __WrapViewportContext(jsCtx)
    return {
        viewport = __WrapViewport(jsCtx.viewport.id),
        session = editor.session
    }
end

-- Invoked by JS Viewport.update()
function __InvokeViewportController(vpId, method, jsCtx, extra, extra2)
    -- This would be populated by the orchestration layer loading the script
    -- For now, we assume global or registered modules
end

function __InvokeViewportFeature(vpId, featureId, method, jsCtx, extra, extra2)
    -- Similar to controller, but for features
end
