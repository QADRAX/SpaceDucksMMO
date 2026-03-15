/**
 * Generates res/scripts/types/input_v2.d.lua from core-v2 INPUT_ACTION_NAMES_LIST.
 * Run: pnpm run generate:input-types
 */
import * as fs from 'fs';
import * as path from 'path';
import { INPUT_ACTION_NAMES_LIST } from '@duckengine/core-v2';

const actionNameAlias = INPUT_ACTION_NAMES_LIST.map((a) => `---| "${a}"`).join('\n');

const output = `---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Input
-- Keyboard, mouse, gamepad, and action-based input.
-- Use getAction("jump") not isKeyPressed("space") — actions are defined in core.
--
-- AUTO-GENERATED. Run: pnpm run generate:input-types
-- ═══════════════════════════════════════════════════════════════════════

---@alias InputActionNameV2
${actionNameAlias}

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

---Get mouse position (screen coordinates).
---@return Vec2V2 position
function input.getMousePosition() end

---Get accumulated wheel delta (zoom/scroll).
---@return number delta
function input.getMouseWheelDelta() end

---Get gamepad state at index. Returns nil if not connected.
---@param index number Gamepad index (0-based).
---@return table|nil state { connected, buttons, axes }
function input.getGamepad(index) end

---Get number of connected gamepads.
---@return number count
function input.getGamepadCount() end

---Request pointer lock on the viewport canvas.
function input.requestPointerLock() end

---Exit pointer lock.
function input.exitPointerLock() end

---Check if pointer is locked.
---@return boolean locked
function input.isPointerLocked() end

---Get action value (0..1 or -1..1). Use canonical names: moveForward, jump, etc.
---@param action InputActionNameV2 Action name.
---@return number value
function input.getAction(action) end

---Get two actions as a 2D vector (e.g., lookHorizontal, lookVertical).
---@param actionX InputActionNameV2 Action for X axis.
---@param actionY InputActionNameV2 Action for Y axis.
---@return Vec2V2 { x, y }
function input.getAction2(actionX, actionY) end

---Check if action is pressed (value > 0).
---@param action InputActionNameV2 Action name.
---@return boolean pressed
function input.isActionPressed(action) end
`;

const targetPath = path.join(__dirname, '../res/scripts/types/input_v2.d.lua');
fs.writeFileSync(targetPath, output, 'utf-8');
console.log('Generated:', targetPath);
