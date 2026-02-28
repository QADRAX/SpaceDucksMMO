---@diagnostic disable: undefined-global
-- ═══════════════════════════════════════════════════════════════════════
-- Editor Sandbox Initialization Script
-- ═══════════════════════════════════════════════════════════════════════

math.clamp = function(v, min, max)
    return math.max(min, math.min(max, v))
end

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

        -- Transform Methods (DuckEntity Parity)
        if k == "getPosition" then
            return function(self)
                local p = __jsEditorApi.getEntityProperty(self.__id, "position")
                return p and math.vec3(p[1], p[2], p[3]) or math.vec3(0, 0, 0)
            end
        end
        if k == "setPosition" then
            return function(self, v)
                __jsEditorApi.setEntityProperty(self.__id, "position", { v[1], v[2], v[3] })
            end
        end
        if k == "getRotation" then
            return function(self)
                local r = __jsEditorApi.getEntityProperty(self.__id, "rotation")
                return r and math.vec3(r[1], r[2], r[3]) or math.vec3(0, 0, 0)
            end
        end
        if k == "setRotation" then
            return function(self, v)
                __jsEditorApi.setEntityProperty(self.__id, "rotation", { v[1], v[2], v[3] })
            end
        end
        if k == "getForward" then
            return function(self)
                local f = __jsEditorApi.getEntityProperty(self.__id, "forward")
                return f and math.vec3(f[1], f[2], f[3]) or math.vec3(0, 0, -1)
            end
        end
        if k == "getRight" then
            return function(self)
                local r = __jsEditorApi.getEntityProperty(self.__id, "right")
                return r and math.vec3(r[1], r[2], r[3]) or math.vec3(1, 0, 0)
            end
        end
        if k == "getUp" then
            return function(self)
                local u = __jsEditorApi.getEntityProperty(self.__id, "up")
                return u and math.vec3(u[1], u[2], u[3]) or math.vec3(0, 1, 0)
            end
        end
        if k == "lookAt" then
            return function(self, target)
                __jsEditorApi.callEntityMethod(self.__id, "lookAt", { target[1], target[2], target[3] })
            end
        end
        if k == "addComponent" then
            return function(self, type, params)
                return __jsEditorApi.callEntityMethod(self.__id, "addComponent", { type, params })
            end
        end

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
    editor.getGameState = __jsEditorApi.getGameState
    editor.getSelectedEntityId = __jsEditorApi.getSelectedEntityId

    -- ═══════════════════════════════════════════════════════════════════════
    -- Viewport Metatable
    -- Allows OOP usage: vp:spawnEntity("Name"), vp:registerPlugin(p)
    -- ═══════════════════════════════════════════════════════════════════════
    __ViewportMT = {
        __index = function(t, k)
            if k == "id" then return t.__id end
            if k == "type" then return t.__type end

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
            if k == "getManagedEntity" then
                return function(self, key)
                    local id = __jsEditorApi.viewports.getManagedEntity(self.__id, key)
                    return __WrapEntity(id)
                end
            end
            if k == "registerPlugin" then
                return function(self, plugin)
                    __jsEditorApi.viewports.registerPlugin(self.__id, plugin)
                end
            end
        end
    }

    function __WrapViewport(jsVp)
        if not jsVp then return nil end
        local vp = { __id = jsVp.id, __type = jsVp.type }
        setmetatable(vp, __ViewportMT)
        return vp
    end

    -- ═══════════════════════════════════════════════════════════════════════
    -- Viewport Context Metatable
    -- Context passed to plugins: ctx.viewport, ctx.engine, ctx.setConfig
    -- ═══════════════════════════════════════════════════════════════════════
    __ViewportContextMT = {
        __index = function(t, k)
            if k == "viewport" then
                return __WrapViewport(t.__jsCtx.viewport)
            end
            if k == "engine" then
                return editor
            end
            if k == "setConfig" then
                return function(key, value)
                    if t.__pluginId then
                        local vpId = t.__jsCtx.viewport.id
                        __jsEditorApi.viewports.setConfig(vpId, t.__pluginId, key, value)
                    end
                end
            end
        end
    }

    function __WrapViewportContext(jsCtx, pluginId)
        if not jsCtx then return nil end
        local ctx = { __jsCtx = jsCtx, __pluginId = pluginId }
        setmetatable(ctx, __ViewportContextMT)
        return ctx
    end

    -- ═══════════════════════════════════════════════════════════════════════
    -- Viewport Script & Plugin Infrastructure
    -- Implements the Class-based / "ScriptModule" pattern for Editor Viewports.
    -- ═══════════════════════════════════════════════════════════════════════

    editor._viewports = {} -- Stores { script = instance, plugins = { [id] = instance } }

    local function createInstance(blueprint, viewport)
        local instance = {
            viewport = viewport,
            properties = {},
            state = {},
            entities = {} -- Managed entities accessible via self.entities[key]
        }

        -- Proxy entities to automatically check bridge for named entities
        setmetatable(instance.entities, {
            __index = function(t, k)
                return viewport:getManagedEntity(k)
            end
        })

        -- Copy properties from schema defaults
        if blueprint.schema and blueprint.schema.properties then
            for k, v in pairs(blueprint.schema.properties) do
                instance.properties[k] = v.default
            end
        end
        return instance
    end

    -- --- Lifecycle Runners ---

    function __InvokeViewportScript(id, method, jsCtx, extra, extra2)
        local vpData = editor._viewports[id]
        if not vpData or not vpData.script then return nil end
        local inst = vpData.script
        local blueprint = vpData.scriptBlueprint

        if not blueprint[method] then return nil end

        local ctx = __WrapViewportContext(jsCtx)

        if method == "onPropertyChanged" then
            local props = extra
            local prevProps = extra2

            -- Sync internal instance props
            if type(props) == "table" then
                for k, v in pairs(props) do inst.properties[k] = v end
            end

            return blueprint.onPropertyChanged(inst, props, prevProps, ctx)
        end

        if extra ~= nil then
            return blueprint[method](inst, extra, ctx)
        else
            return blueprint[method](inst, ctx)
        end
    end

    function __InvokeViewportPlugin(vpId, pluginId, method, jsCtx, extra, extra2)
        local vpData = editor._viewports[vpId]
        if not vpData or not vpData.plugins[pluginId] then return nil end
        local inst = vpData.plugins[pluginId]
        local blueprint = vpData.pluginBlueprints[pluginId]

        if not blueprint[method] then return nil end

        local ctx = __WrapViewportContext(jsCtx, pluginId)

        if method == "onPropertyChanged" then
            local props = extra
            local prevProps = extra2

            -- Sync internal instance props
            if type(props) == "table" then
                for k, v in pairs(props) do inst.properties[k] = v end
            end

            return blueprint.onPropertyChanged(inst, props, prevProps, ctx)
        end

        if extra ~= nil then
            return blueprint[method](inst, extra, ctx)
        else
            return blueprint[method](inst, ctx)
        end
    end

    -- --- Viewport API Extensions ---

    editor.viewports.setScript = function(vpId, blueprint)
        editor._viewports[vpId] = editor._viewports[vpId] or { plugins = {}, pluginBlueprints = {} }
        local vp = editor.viewports.get(vpId)
        local inst = createInstance(blueprint, vp)

        editor._viewports[vpId].script = inst
        editor._viewports[vpId].scriptBlueprint = blueprint

        -- Sync with JS bridge
        __jsEditorApi.viewports.setScript(vpId, blueprint.schema)

        -- Initial call
        if blueprint.init then
            blueprint.init(inst, __WrapViewportContext({ viewport = { id = vpId, type = vp.type } }))
        end
    end

    editor.viewports.addPlugin = function(vpId, blueprint)
        editor._viewports[vpId] = editor._viewports[vpId] or { plugins = {}, pluginBlueprints = {} }
        local vp = editor.viewports.get(vpId)
        local inst = createInstance(blueprint, vp)

        local pluginId = (blueprint.schema and blueprint.schema.id) or ("plugin-" .. tostring(math.random(1000, 9999)))
        editor._viewports[vpId].plugins[pluginId] = inst
        editor._viewports[vpId].pluginBlueprints[pluginId] = blueprint

        -- Register in JS bridge
        __jsEditorApi.viewports.registerPlugin(vpId, pluginId, blueprint.schema)
    end

    -- Helper for "registerPlugin" legacy migration / convenience
    editor.viewports.registerPlugin = function(pluginBlueprint)
        local vpId = __jsEditorApi.viewports.getActiveId()
        if not vpId then return end
        return editor.viewports.addPlugin(vpId, pluginBlueprint)
    end

    -- Inject into ViewportMT
    local oldMTIndex = __ViewportMT.__index
    __ViewportMT.__index = function(t, k)
        if k == "setScript" then
            return function(self, blueprint) return editor.viewports.setScript(self.__id, blueprint) end
        end
        if k == "addPlugin" then
            return function(self, blueprint) return editor.viewports.addPlugin(self.__id, blueprint) end
        end
        return oldMTIndex(t, k)
    end
end
