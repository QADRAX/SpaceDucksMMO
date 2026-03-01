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
-- Transform Metatable
-- ═══════════════════════════════════════════════════════════════════════
__TransformMT = {
    __index = function(t, k)
        local data = __jsEditorApi.getTransform(t.__entityId)
        if not data then return nil end
        return data[k]
    end,
    __newindex = function(t, k, v)
        local data = {}
        data[k] = v
        __jsEditorApi.setTransform(t.__entityId, data)
    end
}

---@param entityId string
---@return TransformComponent
function __WrapTransform(entityId)
    local t = { __entityId = entityId }
    setmetatable(t, __TransformMT)
    return t
end

-- ═══════════════════════════════════════════════════════════════════════
-- Entity Metatable
-- ═══════════════════════════════════════════════════════════════════════
__EntityMT = {
    __index = function(t, k)
        if k == "id" then return t.__id end
        if k == "transform" then return t.__transform end
        if k == "getComponent" then
            return function(self, type)
                return __jsEditorApi.getComponentData(self.__id, type)
            end
        end
        if k == "hasComponent" then
            return function(self, type)
                return __jsEditorApi.hasComponent(self.__id, type)
            end
        end
        -- Default property mapping
        return __jsEditorApi.getEntityProperty(t.__id, k)
    end,
    __newindex = function(t, k, v)
        __jsEditorApi.setEntityProperty(t.__id, k, v)
    end
}

---@param id string
---@return DuckEntity?
function __WrapEntity(id)
    if not id or id == "" then return nil end
    local e = {
        __id = id,
        __transform = __WrapTransform(id)
    }
    setmetatable(e, __EntityMT)
    return e
end

-- ═══════════════════════════════════════════════════════════════════════
-- Session API
-- ═══════════════════════════════════════════════════════════════════════
editor.session = {}

---@return "stopped"|"playing"|"paused"
function editor.session:getGameState()
    return __jsEditorApi.gameState()
end

---@return string|nil
function editor.session:getSelectedEntityId()
    return __jsEditorApi.selectedEntityId()
end

---@return DuckEntity|nil
function editor.session:getSelectedEntity()
    local id = self:getSelectedEntityId()
    if not id then return nil end
    return __WrapEntity(id)
end

---@param entityOrId string|DuckEntity|nil
function editor.session:setSelectedEntity(entityOrId)
    local id = type(entityOrId) == "table" and entityOrId.id or entityOrId
    __jsEditorApi.setSelectedEntity(id)
end

function editor.session:createEntity(parentId)
    return __WrapEntity(__jsEditorApi.createEntity(parentId))
end

function editor.session:deleteEntity(id)
    local targetId = type(id) == "table" and id.id or id
    return __jsEditorApi.deleteEntity(targetId)
end

function editor.session:getEntity(id)
    return __WrapEntity(__jsEditorApi.getEntity(id))
end

function editor.session:findEntityByName(name)
    return __WrapEntity(__jsEditorApi.findEntityByName(name))
end

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
        -- Default viewport property mapping
        return __jsEditorApi.viewports.getViewportProperty(t.__id, k)
    end,
    __newindex = function(t, k, v)
        __jsEditorApi.viewports.setViewportProperty(t.__id, k, v)
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
    for i, v in ipairs(ids) do
        res[i] = __WrapViewport(v.id)
    end
    return res
end

-- ═══════════════════════════════════════════════════════════════════════
-- Context & Lifecycle Helpers
-- ═══════════════════════════════════════════════════════════════════════

---@param jsCtx any
---@return ViewportContext
function __WrapViewportContext(jsCtx)
    return {
        viewport = __WrapViewport(jsCtx.viewport.id),
        session = editor.session
    }
end

---@param jsCtx any
---@return EditorExtensionContext
function __WrapExtensionContext(jsCtx)
    local ctx = {
        gameState = jsCtx.gameState,
        selectedEntityId = jsCtx.selectedEntityId,
        selectedEntity = __WrapEntity(jsCtx.selectedEntityId),

        createEntity = function(parentId) return editor.session:createEntity(parentId) end,
        deleteSelectedEntity = function()
            if jsCtx.selectedEntityId then editor.session:deleteEntity(jsCtx.selectedEntityId) end
        end,
        duplicateSelectedEntity = function()
            return __WrapEntity(__jsEditorApi.duplicateSelectedEntity())
        end,
        setSelectedEntity = function(id) editor.session:setSelectedEntity(id) end,
        reparentEntity = function(childId, parentId) editor.session:reparentEntity(childId, parentId) end,

        setError = function(msg) __jsEditorApi.setError(msg) end,
        setConfig = function(k, v) __jsEditorApi.setConfig(k, v) end,
        onKeyDown = function(s, h) return __jsEditorApi.onKeyDown(s, h) end
    }
    return ctx
end
