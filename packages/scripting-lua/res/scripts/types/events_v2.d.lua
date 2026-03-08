---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Events
-- Event bus for script-to-script communication.
-- ═══════════════════════════════════════════════════════════════════════

---Event bus system for pub/sub communication between scripts.
---@class EventsV2
events = {}

---Fire an event with data.
---@param eventName string Event name.
---@param data table Event payload data.
function events.fire(eventName, data) end

---Subscribe to an event.
---@param eventName string Event name to listen for.
---@param callback fun(data: table):nil Callback function receiving event data.
---@return fun():nil unsubscribe Function to unsubscribe from the event.
function events.on(eventName, callback) end
