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
---@param startPos Vec3
---@param endPos Vec3
---@param color? string Hex string like "#ff0000". Defaults to yellow if omitted.
function gizmos.drawLine(startPos, endPos, color) end

---Draws a wireframe sphere in world space for a single frame.
---@param center Vec3
---@param radius number
---@param color? string Hex string like "#ff0000". Defaults to yellow if omitted.
function gizmos.drawSphere(center, radius, color) end

---Draws a wireframe box in world space for a single frame.
---@param center Vec3
---@param w number Width of the box
---@param h number Height of the box
---@param d number Depth of the box
---@param color? string Hex string like "#ff0000". Defaults to yellow if omitted.
function gizmos.drawBox(center, w, h, d, color) end

---Draws a text label billboard in world space for a single frame.
---@param text string The text content to display.
---@param position Vec3
---@param color? string Hex string like "#ffffff". Defaults to white if omitted.
function gizmos.drawLabel(text, position, color) end

---Draws a grid aligned to the XZ plane for a single frame.
---@param size number The total physical size of the grid.
---@param divisions number The number of subdivisions.
---@param color? string Hex string like "#888888". Defaults to gray if omitted.
function gizmos.drawGrid(size, divisions, color) end

---Draws a camera frustum in world space for a single frame.
---@param fov number Field of view in degrees.
---@param aspect number Aspect ratio (width / height).
---@param near number Near clipping plane distance.
---@param far number Far clipping plane distance.
---@param position Vec3 World position of the camera.
---@param rotation Vec3 Euler rotation in radians.
---@param color? string Hex string like "#ff0000". Defaults to yellow if omitted.
function gizmos.drawFrustum(fov, aspect, near, far, position, rotation, color) end
