-- ═══════════════════════════════════════════════════════════════════════
-- sandbox_metatables.lua — Proxy Metatables for Entities, Components,
--                          Scripts, Prefabs, and the Script Self
-- ═══════════════════════════════════════════════════════════════════════
-- LOAD ORDER: 2 of 4 (after sandbox_security.lua)
--
-- PURPOSE:
--   Define all Lua metatables that power the engine's OOP-style API.
--   When a Lua script writes `self:getPosition()` or `entity.transform.x`,
--   it's really a plain table whose __index metatable calls into JS bridges.
--
-- ─────────────────────────────────────────────────────────────────────
-- PRIMER: HOW LUA METATABLES WORK
-- ─────────────────────────────────────────────────────────────────────
-- In Lua every table can have a "metatable" — a hidden companion table
-- that intercepts operations the table doesn't handle natively.
--
-- The two metamethods we use everywhere:
--
--   __index(table, key)
--     Called when `table.key` is nil (the key doesn't exist on the table).
--     Returns the value the caller should see.  This is how we intercept
--     property reads and route them to TypeScript bridges.
--
--   __newindex(table, key, value)
--     Called when assigning `table.key = value` and the key doesn't
--     already exist as a raw field.  This is how we intercept writes
--     and push them to TS bridges (e.g. setComponentProperty).
--
-- Example:
--   local proxy = { entityId = "npc1", type = "transform" }
--   setmetatable(proxy, {
--       __index = function(t, k)
--           return scene.getComponentProperty(t.entityId, t.type, k)
--       end
--   })
--   print(proxy.x)  -- triggers __index → calls scene.getComponentProperty
--
-- ─────────────────────────────────────────────────────────────────────
-- METATABLE MAP — VISUAL OVERVIEW
-- ─────────────────────────────────────────────────────────────────────
--
--   ┌────────────────────────────────────────────────────────────┐
--   │                     __SelfMT                               │
--   │  The "self" object inside every user script.               │
--   │  Lookup chain:                                             │
--   │    1. rawget (properties, id, slotId, state)               │
--   │    2. JS context (__jsCtx) — getComponent, etc.            │
--   │    3. Fallback to __EntityMT (transform, physics, scripts) │
--   └──────────────────────┬─────────────────────────────────────┘
--                          │ fallback
--   ┌──────────────────────▼─────────────────────────────────────┐
--   │                   __EntityMT                                │
--   │  Wraps any entity reference (self, scene.findEntity, etc.)  │
--   │  Lookup chain:                                              │
--   │    1. "scripts"  → __ScriptsProxyMT (cross-script access)   │
--   │    2. Helper methods (isValid, addComponent, destroy, ...)  │
--   │    3. Transform bridge (getPosition, setPosition, ...)      │
--   │    4. Physics bridge (applyForce, setVelocity, ...)         │
--   │    5. Scene bridge (findEntity, spawn, ...)                 │
--   │    6. Dynamic Component Access → __ComponentMT              │
--   └────────────────────────────────────────────────────────────┘
--
--   ┌────────────────────────────────────────────────────────────┐
--   │                  __ComponentMT                              │
--   │  Wraps a single component on an entity.                    │
--   │  proxy.x  → scene.getComponentProperty(entityId, type, x)  │
--   │  proxy.x = v → scene.setComponentProperty(...)             │
--   └────────────────────────────────────────────────────────────┘
--
--   ┌────────────────────────────────────────────────────────────┐
--   │  __ScriptsProxyMT → __ScriptSlotMT                         │
--   │  Two-level proxy for cross-script property access:          │
--   │    self.scripts[Script.MoveToPoint].targetPoint             │
--   │     └─ ScriptsProxy ──┘                └─ ScriptSlot ──┘   │
--   │  ScriptsProxy[scriptId] → ScriptSlot { entityId, scriptId } │
--   │  ScriptSlot.key → scene.getScriptSlotProperty(...)         │
--   │  ScriptSlot.key = v → scene.setScriptSlotProperty(...)     │
--   └────────────────────────────────────────────────────────────┘
--
--   ┌────────────────────────────────────────────────────────────┐
--   │                   __PrefabMT                                │
--   │  Wraps a prefab reference.  Only method: :instantiate()    │
--   └────────────────────────────────────────────────────────────┘
--
-- ═══════════════════════════════════════════════════════════════════════


-- ── Vec3 Auto-Wrapping (utility used by multiple metatables) ────────
-- Converts plain {x,y,z} tables/userdata returned by TS bridges into
-- proper Vec3 objects with metatables (operators, :clone(), :length()).
-- Safe to call on any value — non-vec3 values pass through unchanged.
--
-- NOTE: `math.vec3` is defined later by math_ext.lua (loaded after
-- all sandbox modules).  This function captures it lazily at call-time,
-- so it must ONLY be called during script hooks — never at load time.
local function __WrapVec3(val)
    if val ~= nil and type(val) ~= "number" and type(val) ~= "string"
       and type(val) ~= "boolean" and type(val) ~= "function" then
        local x, y, z = val.x, val.y, val.z
        if x ~= nil and y ~= nil and z ~= nil then
            return math.vec3(x, y, z)
        end
    end
    return val
end


-- ═══════════════════════════════════════════════════════════════════════
-- 1. __ComponentMT — Component Property Proxy
-- ═══════════════════════════════════════════════════════════════════════
-- Every time you access a component in Lua (e.g. `self.transform.x`),
-- you're actually reading/writing through this metatable, which calls
-- the scene bridge on the TypeScript side.
--
-- Internal table shape:
--   { entityId = "npc1", type = "transform" }

__ComponentMT = {
    __index = function(t, k)
        return scene.getComponentProperty(t.entityId, t.type, k)
    end,
    __newindex = function(t, k, v)
        scene.setComponentProperty(t.entityId, t.type, k, v)
    end
}

--- Create a component proxy for the given entity and component type.
--- @param entityId string  The entity's unique ID.
--- @param type     string  Component type name (e.g. "transform", "mesh").
--- @return table           Proxy table with __ComponentMT metatable.
function __WrapComponent(entityId, type)
    local c = { entityId = entityId, type = type }
    setmetatable(c, __ComponentMT)
    return c
end


-- ═══════════════════════════════════════════════════════════════════════
-- 2. Cross-Script Property Proxy (__ScriptsProxyMT + __ScriptSlotMT)
-- ═══════════════════════════════════════════════════════════════════════
-- Allows one script to read/write properties of another script on the
-- same entity (or any entity).
--
-- USAGE:
--   local mtp = self.scripts[Script.MoveToPoint]  -- returns ScriptSlot proxy
--   mtp.targetPoint = {1, 2, 3}                    -- calls setScriptSlotProperty
--   local dur = mtp.duration                       -- calls getScriptSlotProperty
--
-- HOW IT WORKS (two-level proxy):
--   self.scripts          → ScriptsProxy { entityId }      (__ScriptsProxyMT)
--   self.scripts[id]      → ScriptSlot   { entityId, id }  (__ScriptSlotMT)
--   self.scripts[id].key  → scene.getScriptSlotProperty(entityId, id, key)
--
-- Changes made via setScriptSlotProperty write directly to the target
-- slot's `properties` table on the TS side.  They are synced into the
-- target script's Lua context on the NEXT frame (during earlyUpdate),
-- which calls syncProperties → __UpdateProperty → onPropertyChanged.

__ScriptSlotMT = {
    __index = function(t, k)
        return scene.getScriptSlotProperty(t.entityId, t.scriptId, k)
    end,
    __newindex = function(t, k, v)
        scene.setScriptSlotProperty(t.entityId, t.scriptId, k, v)
    end
}

--- Create a script-slot proxy for reading/writing another script's properties.
--- @param entityId string  The entity that owns the target script.
--- @param scriptId string  The target script's URI (e.g. Script.MoveToPoint).
--- @return table           Proxy table with __ScriptSlotMT metatable.
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

--- Create the top-level scripts proxy for an entity.
--- Indexing this with a script URI returns a ScriptSlot proxy.
--- @param entityId string
--- @return table  Proxy table with __ScriptsProxyMT metatable.
function __WrapScriptsProxy(entityId)
    local p = { entityId = entityId }
    setmetatable(p, __ScriptsProxyMT)
    return p
end


-- ═══════════════════════════════════════════════════════════════════════
-- 3. __PrefabMT — Prefab Reference Proxy
-- ═══════════════════════════════════════════════════════════════════════
-- Wraps a prefab key string so it can be instantiated:
--   local p = self.properties.myPrefab  -- returns a PrefabMT proxy
--   p:instantiate({ position = {1,2,3} })

__PrefabMT = {
    __index = {
        instantiate = function(t, overrides)
            return scene.instantiatePrefab(t.key, overrides)
        end
    }
}

--- Create a prefab proxy.
--- @param key string  The prefab registry key.
--- @return table      Proxy table with __PrefabMT metatable.
function __WrapPrefab(key)
    local p = { key = key }
    setmetatable(p, __PrefabMT)
    return p
end


-- ═══════════════════════════════════════════════════════════════════════
-- 4. __EntityMT — Entity Proxy
-- ═══════════════════════════════════════════════════════════════════════
-- The most complex metatable.  Any entity reference in Lua (from
-- scene.findEntity, self.properties.target, waypoint arrays, etc.)
-- is a plain table `{ id = "entity-id" }` with this metatable.
--
-- The __index function implements a priority chain:
--   0. "scripts"  → cross-script proxy (__ScriptsProxyMT)
--   1. Named helper methods (isValid, addComponent, destroy, ...)
--   2. Transform bridge functions (getPosition, setPosition, ...)
--   3. Physics bridge functions (applyForce, setVelocity, ...)
--   4. Scene bridge functions (findEntity, spawn, ...)
--   5. Fallback: Dynamic Component Access (UCA) → __ComponentMT
--
-- The fallback at step 5 means `entity.mesh` is equivalent to
-- calling `entity:getComponent("mesh")`.

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
        if k == "destroy" then
            return function(self) scene.destroyEntity(self.id) end
        end

        -- 2. Transform / Physics / Scene bridge helpers
        --    Return values are auto-wrapped: plain {x,y,z} → Vec3 with metatables.
        if transform and transform[k] then
            return function(self, ...) return __WrapVec3(transform[k](self, ...)) end
        end
        if physics and physics[k] then
            return function(self, ...) return __WrapVec3(physics[k](self, ...)) end
        end
        if scene and scene[k] then
            return function(self, ...) return scene[k](self, ...) end
        end

        -- 3. Dynamic Component Access (UCA)
        --    entity.mesh  →  __WrapComponent(entity.id, "mesh")
        return __WrapComponent(t.id, k)
    end
}

--- Create an entity proxy from an entity ID string.
--- Returns nil for empty/nil IDs (safe to call with bad data).
--- @param id string|nil  The entity's unique ID.
--- @return table|nil     Proxy table with __EntityMT, or nil.
function __WrapEntity(id)
    if not id or id == "" then return nil end
    local e = { id = id }
    setmetatable(e, __EntityMT)
    return e
end


-- ═══════════════════════════════════════════════════════════════════════
-- 5. __SelfMT — Script Self Proxy
-- ═══════════════════════════════════════════════════════════════════════
-- This is the metatable set on the `self` object inside every user
-- script.  It is the FIRST metatable consulted when a script does
-- `self.anything`.
--
-- IMPORTANT DESIGN DECISION:
--   `self` is NOT just an entity proxy (__EntityMT).  It has extra
--   fields that don't exist on regular entities:
--     • self.properties  — the script's declared property values
--     • self.id          — shortcut to the entity ID
--     • self.slotId      — the script slot's unique ID
--     • self.state       — persistent state table (private to this script)
--     • self.__jsCtx     — hidden reference to the JS LuaSelfInstance
--
--   The lookup chain for self.X:
--     1. rawget: properties, id, slotId, state  → return immediately
--     2. JS context (__jsCtx): getComponent function, etc.
--        Values returned from JS are auto-wrapped (Vec3 hydration).
--     3. Fallback to __EntityMT.__index: scripts, transform helpers,
--        physics helpers, dynamic component access.
--
--   This means `self:getPosition()` and `self.scripts[...]` both work
--   even though they are NOT raw fields — they resolve via step 3.

__SelfMT = {
    __index = function(t, k)
        -- Step 1: Reserved raw fields — stored directly on the Lua table.
        if k == "properties" or k == "id" or k == "slotId" or k == "state" then
            return rawget(t, k)
        end

        -- Step 2: JS context properties (e.g. getComponent).
        -- Values from JS that look like {x,y,z} are auto-wrapped to Vec3.
        local jsCtx = rawget(t, "__jsCtx")
        local val = jsCtx and jsCtx[k]
        if val ~= nil then return __WrapVec3(val) end

        -- Step 3: Entity behavior fallback.
        -- This gives `self` the same API as any entity proxy:
        -- self.scripts, self:getPosition(), self:destroy(), etc.
        return __EntityMT.__index(t, k)
    end,

    -- Writes go to the JS context so TypeScript can observe them.
    __newindex = function(t, k, v)
        t.__jsCtx[k] = v
    end
}
