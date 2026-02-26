---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Gizmos
-- The underlying gizmo framework provides an imperative, frame-cleared
-- mechanism for drawing 3D overlay graphics. Useful for debugging,
-- editor tools, and visualizing invisible gameplay logic.
-- ═══════════════════════════════════════════════════════════════════════

---@class GizmosAPI
---The global gizmos API table.
gizmos = {}

---Draws a line segment between two points in world space for a single frame.
---@param x1 number
---@param y1 number
---@param z1 number
---@param x2 number
---@param y2 number
---@param z2 number
---@param color? string Hex string like "#ff0000". Defaults to yellow if omitted.
function gizmos.drawLine(x1, y1, z1, x2, y2, z2, color) end

---Draws a wireframe sphere in world space for a single frame.
---@param x number
---@param y number
---@param z number
---@param radius number
---@param color? string Hex string like "#ff0000". Defaults to yellow if omitted.
function gizmos.drawSphere(x, y, z, radius, color) end

---Draws a wireframe box in world space for a single frame.
---@param x number
---@param y number
---@param z number
---@param w number
---@param h number
---@param d number
---@param color? string Hex string like "#ff0000". Defaults to yellow if omitted.
function gizmos.drawBox(x, y, z, w, h, d, color) end
