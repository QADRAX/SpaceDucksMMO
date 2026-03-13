---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Input
-- Keyboard, mouse, and gamepad input handling.
-- ═══════════════════════════════════════════════════════════════════════

---Mouse button state.
---@class MouseButtonsV2
---@field left boolean Left mouse button state.
---@field right boolean Right mouse button state.
---@field middle boolean Middle mouse button state.

---Input system bridge.
---@class InputV2
input = {}

---Check if a key is pressed this frame.
---@param key string Key name (e.g., "w", "space", "enter").
---@return boolean pressed
function input.isKeyPressed(key) end

---Get mouse movement delta in screen space pixels.
---@return Vec2V2 delta
function input.getMouseDelta() end

---Get current mouse button states.
---@return MouseButtonsV2 buttons
function input.getMouseButtons() end
