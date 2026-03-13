-- ═══════════════════════════════════════════════════════════════════════
-- sandbox_hydration.lua — Property Hydration & Self Construction
-- ═══════════════════════════════════════════════════════════════════════
-- LOAD ORDER: 3 of 4 (after sandbox_metatables.lua)
--
-- PURPOSE:
--   Convert raw JS property values (strings, arrays, plain objects)
--   into rich Lua proxy objects (entity proxies, Vec3, etc.) and
--   construct the `self` object that every user script receives.
--
-- DEPENDS ON (from sandbox_metatables.lua):
--   __WrapEntity, __WrapComponent, __WrapPrefab  — proxy constructors
--   __SelfMT                                      — self metatable
--
-- ─────────────────────────────────────────────────────────────────────
-- PROPERTY HYDRATION EXPLAINED
-- ─────────────────────────────────────────────────────────────────────
-- Scripts declare typed properties in their `schema`:
--
--   schema = {
--       properties = {
--           target    = { type = "entity",      default = "" },
--           waypoints = { type = "entityArray",  default = {} },
--           offset    = { type = "vec3",         default = {0,0,0} },
--           skin      = { type = "prefab",       default = "" },
--       }
--   }
--
-- On the TypeScript side these are stored as raw primitives:
--   • entity     → string (entity ID, e.g. "npc1")
--   • entityArray → string[] (array of entity IDs)
--   • vec3       → [x,y,z] array or {x,y,z} object
--   • prefab     → string (prefab registry key)
--   • component  → string (entity ID, paired with componentType)
--
-- __WrapValue converts these TS-side representations into Lua proxies
-- so that script code can write:
--   self.properties.target:getPosition()   -- entity proxy
--   self.properties.offset:length()        -- Vec3 with methods
--   self.properties.skin:instantiate()     -- prefab proxy
-- ═══════════════════════════════════════════════════════════════════════


-- ── __WrapValue (GLOBAL) ─────────────────────────────────────────────
-- Converts a single raw JS property value into the appropriate Lua type,
-- guided by the property definition from the script's schema.
--
-- Declared as a global (not local) because sandbox_runtime.lua references
-- it from __UpdateProperty.  In Lua, `local x = ...; x = x` is a no-op
-- that does NOT promote the local to a global.
--
-- @param val     any        The raw value from JS (string, table, userdata, etc.)
-- @param propDef table|nil  The schema entry: { type = "entity"|"vec3"|... }
-- @return any               The hydrated Lua value (proxy, Vec3, array, or passthrough)

function __WrapValue(val, propDef)
    if not propDef then return val end

    if propDef.type == "entity" and type(val) == "string" and val ~= "" then
        -- Entity ID string → entity proxy with __EntityMT
        return __WrapEntity(val)

    elseif propDef.type == "component" and type(val) == "string" and val ~= "" then
        -- Entity ID + component type → component proxy with __ComponentMT
        return __WrapComponent(val, propDef.componentType)

    elseif propDef.type == "prefab" and type(val) == "string" and val ~= "" then
        -- Prefab key → prefab proxy with __PrefabMT
        return __WrapPrefab(val)

    elseif propDef.type == "vec3" and val ~= nil then
        -- Vec3 can arrive from JS in two formats:
        --   Array format:  [1, 2, 3]  →  val[1], val[2], val[3]
        --   Object format: {x:1, y:2, z:3}  →  val.x, val.y, val.z
        if val[1] ~= nil then
            return math.vec3(val[1], val[2], val[3])
        elseif val.x ~= nil then
            return math.vec3(val.x, val.y, val.z)
        end

    elseif propDef.type == "entityArray" and val ~= nil then
        -- Array of entity ID strings → array of entity proxies.
        -- Uses numeric index iteration (val is JS array → Lua userdata).
        local result = {}
        local i = 1
        while val[i] ~= nil do
            local entry = val[i]
            if type(entry) == "string" and entry ~= "" then
                result[#result + 1] = __WrapEntity(entry)
            end
            i = i + 1
        end
        return result
    end

    -- All other types (number, string, boolean) pass through unchanged.
    return val
end


-- ═══════════════════════════════════════════════════════════════════════
-- __WrapSelf — Construct the `self` object for a script instance
-- ═══════════════════════════════════════════════════════════════════════
-- Called once per script slot during compilation (in ScriptInstanceManager.
-- compileSlot → doStringSync).  Receives the raw JS context object
-- (LuaSelfInstance) and the script's schema, and returns a Lua table
-- with __SelfMT that the script will use as `self` in every hook call.
--
-- STRUCTURE OF THE RETURNED TABLE:
--   {
--       __jsCtx     = <userdata: JS LuaSelfInstance>,  -- hidden from scripts
--       id          = "entity-id",                     -- entity this script runs on
--       slotId      = "slot_entity_0",                 -- unique slot identifier
--       state       = {},                              -- private Lua-only state
--       properties  = {                                -- hydrated property values
--           speed = 5,
--           target = <entity proxy>,
--           offset = <Vec3>,
--           ...
--       }
--   }
--   metatable: __SelfMT
--
-- WHY state IS A PURE LUA TABLE:
--   wasmoon destroys metatables when serialising Lua tables across the
--   Lua↔JS boundary.  By keeping state as a raw Lua table (never
--   assigned to jsCtx), Vec3 values and other metatable-dependent
--   objects stored in state survive across frames.
--
-- WHY properties IS COPIED (not proxied):
--   Same reason as state — we copy JS property values into a plain
--   Lua table and hydrate them with __WrapValue once.  When properties
--   change on the TS side, syncProperties detects the diff and calls
--   __UpdateProperty to patch individual keys (see sandbox_runtime.lua).

function __WrapSelf(jsCtx, schema)
    local s = { __jsCtx = jsCtx }
    s.id     = jsCtx.id
    s.slotId = jsCtx.slotId
    s.state  = {}

    -- Hydrate properties from JS values → Lua proxies using schema types.
    local props = {}
    if schema and schema.properties then
        for k, propDef in pairs(schema.properties) do
            local val = jsCtx.properties[k]
            props[k] = __WrapValue(val, propDef)
        end
    end
    s.properties = props

    setmetatable(s, __SelfMT)
    return s
end
