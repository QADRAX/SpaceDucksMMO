---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Gizmos
-- Debug visualization (lines, spheres, boxes, labels).
-- ═══════════════════════════════════════════════════════════════════════

---Gizmo system for debug visualization.
---@class GizmoV2
gizmos = {}

---Draw a line in world space.
---@param from Vec3V2 Start position.
---@param to Vec3V2 End position.
---@param color string|nil Hex color string or color name (defaults to white).
function gizmos.drawLine(from, to, color) end

---Draw a sphere wireframe in world space.
---@param center Vec3V2 Center position.
---@param radius number Sphere radius.
---@param color string|nil Hex color string or color name (defaults to white).
function gizmos.drawSphere(center, radius, color) end

---Draw a box wireframe in world space.
---@param center Vec3V2 Center position.
---@param size Vec3V2 Box dimensions.
---@param color string|nil Hex color string or color name (defaults to white).
function gizmos.drawBox(center, size, color) end

---Draw a text label in world space.
---@param text string Label text.
---@param position Vec3V2 Label position.
---@param color string|nil Hex color string or color name (defaults to white).
function gizmos.drawLabel(text, position, color) end

---Clear all queued gizmo draws.
function gizmos.clear() end
