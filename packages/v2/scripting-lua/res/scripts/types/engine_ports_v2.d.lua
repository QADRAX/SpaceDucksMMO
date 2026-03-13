---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Engine Ports (Custom)
--
-- Custom ports are injected at runtime via definePort().bind().
-- Access via: engine_ports['port-id'].methodName(...)
--
-- Async ports: methods with { async: true } accept a callback as last arg.
-- Convention: callback(err, result) — err is nil on success, result is the data.
--
-- Extend this file to add type definitions for your custom ports.
-- ═══════════════════════════════════════════════════════════════════════

---Known custom port IDs and their API shapes.
---Extend with your own ports: engine_ports['your:port-id'].
---@class EnginePortsV2
---@field [string] table Port methods keyed by port ID.

---Custom ports table. Keys are port IDs (e.g. 'game:my-port').
---@type EnginePortsV2
engine_ports = {}
