---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Input
-- Global `input` table for keyboard, mouse, and pointer lock access.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Key Name Enum
-- ───────────────────────────────────────────────────────────────────────

---All recognized keyboard key names for `input.isKeyPressed()`.
---These map to the browser's `KeyboardEvent.key` values (lowercased).
---Any string is accepted; the listed values provide IDE autocomplete.
---@alias KeyName
---| "w"          # W key (commonly: forward).
---| "a"          # A key (commonly: strafe left).
---| "s"          # S key (commonly: backward).
---| "d"          # D key (commonly: strafe right).
---| "q"          # Q key.
---| "e"          # E key (commonly: interact).
---| "r"          # R key (commonly: reload).
---| "f"          # F key.
---| "g"          # G key.
---| "h"          # H key.
---| "i"          # I key.
---| "j"          # J key.
---| "k"          # K key.
---| "l"          # L key.
---| "m"          # M key.
---| "n"          # N key.
---| "o"          # O key.
---| "p"          # P key.
---| "t"          # T key.
---| "u"          # U key.
---| "v"          # V key.
---| "x"          # X key.
---| "y"          # Y key.
---| "z"          # Z key.
---| "b"          # B key.
---| "c"          # C key.
---| "0"          # Number 0.
---| "1"          # Number 1.
---| "2"          # Number 2.
---| "3"          # Number 3.
---| "4"          # Number 4.
---| "5"          # Number 5.
---| "6"          # Number 6.
---| "7"          # Number 7.
---| "8"          # Number 8.
---| "9"          # Number 9.
---| "space"      # Spacebar (commonly: jump).
---| "shift"      # Left or right Shift (commonly: sprint).
---| "control"    # Left or right Ctrl (commonly: crouch).
---| "alt"        # Left or right Alt.
---| "tab"        # Tab key.
---| "escape"     # Escape key.
---| "enter"      # Enter / Return key.
---| "backspace"  # Backspace key.
---| "delete"     # Delete key.
---| "arrowup"    # Up arrow key.
---| "arrowdown"  # Down arrow key.
---| "arrowleft"  # Left arrow key.
---| "arrowright"  # Right arrow key.
---| "f1"         # Function key F1.
---| "f2"         # Function key F2.
---| "f3"         # Function key F3.
---| "f4"         # Function key F4.
---| "f5"         # Function key F5.
---| "f6"         # Function key F6.
---| "f7"         # Function key F7.
---| "f8"         # Function key F8.
---| "f9"         # Function key F9.
---| "f10"        # Function key F10.
---| "f11"        # Function key F11.
---| "f12"        # Function key F12.
---| string       # Any other key name (browser KeyboardEvent.key, lowercased).

-- ───────────────────────────────────────────────────────────────────────
-- Mouse Button State
-- ───────────────────────────────────────────────────────────────────────

---The state of all three mouse buttons.
---@class MouseButtonState
---@field left boolean `true` if the left mouse button is pressed.
---@field right boolean `true` if the right mouse button is pressed.
---@field middle boolean `true` if the middle mouse button (scroll wheel click) is pressed.

---The mouse movement delta for the current frame.
---@class MouseDelta
---@field x number Horizontal pixel delta since last frame. Positive = right.
---@field y number Vertical pixel delta since last frame. Positive = down.

-- ───────────────────────────────────────────────────────────────────────
-- Input API
-- ───────────────────────────────────────────────────────────────────────

---@class InputAPI
---The global input API for reading keyboard and mouse state.
input = {}

---Returns `true` if the given key is currently pressed on this frame.
---
---Example:
---```lua
---if input.isKeyPressed("w") then
---    -- move forward
---end
---```
---@param key KeyName The key identifier (lowercase).
---@return boolean pressed `true` if the key is held down.
function input.isKeyPressed(key) end

---Returns the mouse movement delta since the last frame.
---Only meaningful when pointer lock is active.
---
---Example:
---```lua
---local md = input.getMouseDelta()
---yaw = yaw - md.x * sensitivity
---```
---@return MouseDelta delta Table with `x` and `y` pixel deltas.
function input.getMouseDelta() end

---Returns the current pressed state of all three mouse buttons.
---
---Example:
---```lua
---local buttons = input.getMouseButtons()
---if buttons.left then fire() end
---```
---@return MouseButtonState buttons Table with `left`, `right`, `middle` booleans.
function input.getMouseButtons() end

---Requests the browser to lock the mouse pointer.
---While locked, the cursor is hidden and `getMouseDelta()` returns infinite-range deltas.
---This is essential for first-person camera controls.
---Has no effect if the pointer is already locked.
function input.requestPointerLock() end

---Exits pointer lock mode, restoring the normal cursor.
---Has no effect if the pointer is not currently locked.
function input.exitPointerLock() end
