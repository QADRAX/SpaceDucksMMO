---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Engine (System Ports)
--
-- System-level ports (Input, Gizmo, Physics, Time) live in Engine namespace.
-- Use Engine.Input, Engine.Gizmo, etc. — not on self.
-- ═══════════════════════════════════════════════════════════════════════

---@class EngineV2
---@field Input InputV2? Keyboard and mouse state.
---@field Gizmo GizmoV2? Debug drawing (drawLine, drawSphere, etc.).
---@field Physics PhysicsV2? Raycast and physics queries.
---@field Time TimeV2? Delta time, elapsed, frame count.

---Global Engine namespace for system ports.
---@type EngineV2
Engine = {}
