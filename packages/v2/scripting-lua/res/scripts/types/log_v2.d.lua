---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Log
-- Writes to the engine diagnostic port (harness getLogs / log stack).
-- Access via `self.Log`.
-- ═══════════════════════════════════════════════════════════════════════

---@class LogV2
local LogV2 = {}

---@param message string
function LogV2.debug(message) end

---@param message string
function LogV2.info(message) end

---@param message string
function LogV2.warn(message) end

---@param message string
function LogV2.error(message) end
