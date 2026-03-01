-- ═══════════════════════════════════════════════════════════════════════
-- sandbox_runtime.lua — Slot Storage, Hook Execution & Property Sync
-- ═══════════════════════════════════════════════════════════════════════
-- LOAD ORDER: 4 of 4 (after sandbox_hydration.lua)
--
-- PURPOSE:
--   Manage the Lua-side storage of compiled script instances and
--   provide the entry points that TypeScript calls to execute hooks
--   and synchronise property changes.
--
-- DEPENDS ON (from previous modules):
--   __WrapValue  — property hydration (sandbox_hydration.lua)
--   __SelfMT     — self metatable (sandbox_metatables.lua)
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY STORAGE LIVES IN LUA (NOT IN TYPESCRIPT)
-- ─────────────────────────────────────────────────────────────────────
-- wasmoon (the Lua↔JS bridge) serialises Lua tables to plain JS
-- objects when they cross the boundary.  This serialisation DESTROYS
-- all metatables — which means entity proxies, Vec3 objects, and the
-- self context would lose their __index/__newindex behaviour.
--
-- To avoid this, we keep two global dictionaries entirely in Lua:
--   __Contexts   — the `self` object for each compiled slot
--   __SlotHooks  — the hook function table for each compiled slot
--
-- TypeScript only passes opaque string keys (slotId) across the
-- boundary when it wants to invoke a hook or update a property.
-- ═══════════════════════════════════════════════════════════════════════


-- ── Global Storage ──────────────────────────────────────────────────
-- Keyed by slotId (e.g. "slot_player_0").

__Contexts  = {}   -- slotId → self table (with __SelfMT metatable)
__SlotHooks = {}   -- slotId → { init=fn, update=fn, onPropertyChanged=fn, ... }


-- ═══════════════════════════════════════════════════════════════════════
-- __StoreSlot — Save a compiled script's hooks and context
-- ═══════════════════════════════════════════════════════════════════════
-- Called from TypeScript (ScriptInstanceManager.compileSlot) via
-- doStringSync after a user script has been compiled and __WrapSelf
-- has built the self context.
--
-- @param slotId string  Unique slot identifier
-- @param hooks  table   The table returned by the user script (contains
--                        hook functions: init, update, onPropertyChanged, etc.)
-- @param ctx    table   The `self` object built by __WrapSelf

function __StoreSlot(slotId, hooks, ctx)
    __SlotHooks[slotId] = hooks
    __Contexts[slotId]  = ctx
end


-- ═══════════════════════════════════════════════════════════════════════
-- __CallHook — Execute a named hook for a slot
-- ═══════════════════════════════════════════════════════════════════════
-- Called from TypeScript (ScriptRuntime.callHook) every frame for
-- lifecycle hooks (init, earlyUpdate, update, lateUpdate, etc.) and
-- on events (onCollisionEnter, onPropertyChanged, etc.).
--
-- The hook function receives `self` (the context) as its first argument,
-- followed by any extra args (e.g. `dt` for update, collision data, etc.).
--
-- Always returns true — errors are caught on the TypeScript side by
-- the try/catch in ScriptRuntime.callHook.
--
-- @param slotId   string    Slot identifier
-- @param hookName string    Name of the hook ("update", "init", etc.)
-- @param ...      any       Extra arguments forwarded to the hook
-- @return boolean           Always true

function __CallHook(slotId, hookName, ...)
    local hooks = __SlotHooks[slotId]
    local ctx   = __Contexts[slotId]
    if not hooks or not ctx then return true end
    local fn = hooks[hookName]
    if not fn then return true end
    fn(ctx, ...)
    return true
end


-- ═══════════════════════════════════════════════════════════════════════
-- __RemoveSlot — Clean up a slot's data when it is destroyed
-- ═══════════════════════════════════════════════════════════════════════
-- Called when an entity is unregistered or a script component is removed.
-- Frees all Lua references so the garbage collector can reclaim memory.
--
-- @param slotId string

function __RemoveSlot(slotId)
    __SlotHooks[slotId] = nil
    __Contexts[slotId]  = nil
end


-- ═══════════════════════════════════════════════════════════════════════
-- __UpdateProperty — Patch a single property in an existing context
-- ═══════════════════════════════════════════════════════════════════════
-- Called from TypeScript (ScriptInstanceManager.syncProperties) when
-- it detects that a slot's properties have changed since the last frame.
--
-- syncProperties does a JSON.stringify diff on the TS side, and for
-- each changed key calls this function to update the Lua-side copy.
-- The value is hydrated through __WrapValue (entity IDs → proxies, etc.)
-- before being stored.
--
-- After all changed keys are updated, TS calls __CallHook with
-- "onPropertyChanged" so the script can react to the change.
--
-- @param slotId  string       Slot identifier
-- @param key     string       Property name
-- @param val     any          Raw JS value
-- @param propDef table|nil    Schema definition ({ type = "entity", ... })

function __UpdateProperty(slotId, key, val, propDef)
    local ctx = __Contexts[slotId]
    if ctx and ctx.properties then
        ctx.properties[key] = __WrapValue(val, propDef)
    end
end
