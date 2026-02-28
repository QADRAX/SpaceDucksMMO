-- ═══════════════════════════════════════════════════════════════════════
-- Sandbox Initialization Script
-- ═══════════════════════════════════════════════════════════════════════

-- Secure environment by clearing sensitive globals
os = nil
io = nil
debug = nil
loadfile = nil
dofile = nil

-- Script Reference Constants and Helpers
Script = {
    -- Built-in Scripts (Core)
    FirstPersonMove        = "builtin://first_person_move.lua",
    FirstPersonPhysicsMove = "builtin://first_person_physics_move.lua",
    FollowEntity           = "builtin://follow_entity.lua",
    FollowEntityPhysics    = "builtin://follow_entity_physics.lua",
    LookAtEntity           = "builtin://look_at_entity.lua",
    LookAtPoint            = "builtin://look_at_point.lua",
    MouseLook              = "builtin://mouse_look.lua",
    MoveToPoint            = "builtin://move_to_point.lua",
    OrbitCamera            = "builtin://orbit_camera.lua",
    SmoothFollow           = "builtin://smooth_follow.lua",
    SmoothLookAt           = "builtin://smooth_look_at.lua",

    -- Helpers for custom script paths
    editor                 = function(name) return "editor://" .. name .. ".lua" end,
    project                = function(name) return "project://" .. name .. ".lua" end
}


__SelfMT = {
    __index = function(t, k)
        return t.__jsCtx[k]
    end,
    __newindex = function(t, k, v)
        t.__jsCtx[k] = v
    end
}

function __WrapSelf(jsCtx)
    local s = { __jsCtx = jsCtx }
    -- Copy ID and slotId for easy access without going through proxy
    s.id = jsCtx.id
    s.slotId = jsCtx.slotId
    setmetatable(s, __SelfMT)
    return s
end

-- Setup OOP Metatable logic for Entities and Components
__ComponentMT = {
    __index = function(t, k)
        return scene.getComponentProperty(t.entityId, t.type, k)
    end,
    __newindex = function(t, k, v)
        scene.setComponentProperty(t.entityId, t.type, k, v)
    end
}

function __WrapComponent(entityId, type)
    local c = { entityId = entityId, type = type }
    setmetatable(c, __ComponentMT)
    return c
end

-- Cross-script property proxy: entity.scripts.scriptName.propKey
__ScriptSlotMT = {
    __index = function(t, k)
        return scene.getScriptSlotProperty(t.entityId, t.scriptId, k)
    end,
    __newindex = function(t, k, v)
        scene.setScriptSlotProperty(t.entityId, t.scriptId, k, v)
    end
}

function __WrapScriptSlot(entityId, scriptId)
    local s = { entityId = entityId, scriptId = scriptId }
    setmetatable(s, __ScriptSlotMT)
    return s
end

__ScriptsProxyMT = {
    __index = function(t, scriptId)
        return __WrapScriptSlot(t.entityId, scriptId)
    end
}

function __WrapScriptsProxy(entityId)
    local p = { entityId = entityId }
    setmetatable(p, __ScriptsProxyMT)
    return p
end

-- Prefabs: prefab:instantiate(overrides)
__PrefabMT = {
    __index = {
        instantiate = function(t, overrides)
            return scene.instantiatePrefab(t.key, overrides)
        end
    }
}

function __WrapPrefab(key)
    local p = { key = key }
    setmetatable(p, __PrefabMT)
    return p
end

__EntityMT = {
    __index = function(t, k)
        -- 0. Cross-script access: entity.scripts
        if k == "scripts" then
            return __WrapScriptsProxy(t.id)
        end

        -- 1. Helper methods
        if k == "isValid" then
            return function(self) return scene.__exists(self.id) end
        end
        if k == "addComponent" then
            return function(self, type, params) return scene.addComponent(self.id, type, params) end
        end
        if k == "removeComponent" then
            return function(self, type) return scene.removeComponent(self.id, type) end
        end
        if k == "hasComponent" then
            return function(self, type) return scene.hasComponent(self.id, type) end
        end
        if k == "getComponent" then
            return function(self, type)
                if scene.hasComponent(self.id, type) then
                    return __WrapComponent(self.id, type)
                end
                return nil
            end
        end
        if k == "applyMaterial" then
            return function(self, key, overrides)
                return scene.applyResource(self.id, key, "standardMaterial", overrides)
            end
        end
        if k == "applyGeometry" then
            return function(self, key, overrides)
                return scene.applyResource(self.id, key, nil, overrides)
            end
        end
        if k == "applyResource" then
            return function(self, key, overrides) return scene.applyResource(self.id, key, nil, overrides) end
        end

        -- 2. Transform / Physics explicit bridge helpers
        if transform[k] then
            return function(self, ...) return transform[k](self, ...) end
        end
        if physics[k] then
            return function(self, ...) return physics[k](self, ...) end
        end
        if scene[k] then
            return function(self, ...) return scene[k](self, ...) end
        end

        -- 3. Dynamic Component Access (UCA)
        return __WrapComponent(t.id, k)
    end
}

function __WrapEntity(id)
    if not id or id == "" then return nil end
    local e = { id = id }
    setmetatable(e, __EntityMT)
    return e
end
