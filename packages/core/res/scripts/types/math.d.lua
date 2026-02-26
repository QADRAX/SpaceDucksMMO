---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Math Extensions
-- Extended math library: `math.ext.lerp`, `math.ext.clamp`,
-- and `math.ext.easing.*` with 16 named easing curves.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- Easing Name Enum
-- ───────────────────────────────────────────────────────────────────────

---All available easing function names. Use with `math.ext.easing[name]`
---or pass as `easing` property in scripts like `smooth_follow`, `move_to_point`, etc.
---
---Visual reference: https://easings.net
---@alias EasingName
---| "linear"       # Constant speed, no acceleration. `f(t) = t`.
---| "smoothstep"   # Hermite interpolation. Smooth start and end. `f(t) = t²(3 - 2t)`.
---| "quadIn"       # Quadratic ease-in. Slow start, fast end. `f(t) = t²`.
---| "quadOut"      # Quadratic ease-out. Fast start, slow end. `f(t) = t(2 - t)`.
---| "quadInOut"    # Quadratic ease-in-out. Slow start and end.
---| "cubicIn"      # Cubic ease-in. Very slow start. `f(t) = t³`.
---| "cubicOut"     # Cubic ease-out. Fast start, very slow end.
---| "cubicInOut"   # Cubic ease-in-out. Very smooth S-curve.
---| "sineIn"       # Sinusoidal ease-in. Gentle start.
---| "sineOut"      # Sinusoidal ease-out. Gentle end.
---| "sineInOut"    # Sinusoidal ease-in-out. Natural wave-like motion.
---| "expIn"        # Exponential ease-in. Nearly invisible start, explosive end.
---| "expOut"       # Exponential ease-out. Explosive start, nearly invisible end.
---| "circleIn"     # Circular ease-in. Based on quarter-circle arc.
---| "circleOut"    # Circular ease-out. Based on quarter-circle arc.
---| "bounceOut"    # Bounce effect at the end. Simulates physical bounce.

-- ───────────────────────────────────────────────────────────────────────
-- Easing Functions Table
-- ───────────────────────────────────────────────────────────────────────

---Table of easing functions accessible via `math.ext.easing.<name>(t)`.
---Each function accepts a normalized time `t` in `[0, 1]` and returns
---the eased value, also typically in `[0, 1]` (bounceOut may exceed slightly).
---
---Example:
---```lua
---local eased = math.ext.easing.cubicOut(0.5) -- returns ~0.875
---local pos = math.ext.lerp(startX, endX, eased)
---```
---@class LuaMathEasing
local LuaMathEasing = {}

---No acceleration. Constant speed.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.linear(t) end

---Hermite smoothstep. Smooth acceleration and deceleration.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.smoothstep(t) end

---Quadratic ease-in. Starts slowly, accelerates.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.quadIn(t) end

---Quadratic ease-out. Starts fast, decelerates.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.quadOut(t) end

---Quadratic ease-in-out. Slow start and end, fast middle.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.quadInOut(t) end

---Cubic ease-in. Very slow start, strong acceleration.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.cubicIn(t) end

---Cubic ease-out. Fast start, very smooth stop.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.cubicOut(t) end

---Cubic ease-in-out. Very smooth S-curve.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.cubicInOut(t) end

---Sinusoidal ease-in. Gentle, wave-like start.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.sineIn(t) end

---Sinusoidal ease-out. Gentle, wave-like end.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.sineOut(t) end

---Sinusoidal ease-in-out. Natural wave-like motion.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.sineInOut(t) end

---Exponential ease-in. Nearly invisible start, explosive acceleration.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.expIn(t) end

---Exponential ease-out. Explosive start, nearly invisible deceleration.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.expOut(t) end

---Circular ease-in. Based on a quarter-circle arc.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.circleIn(t) end

---Circular ease-out. Based on a quarter-circle arc.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.circleOut(t) end

---Bounce ease-out. Simulates a ball bouncing and settling.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value (may slightly exceed 1.0 during bounces).
function LuaMathEasing.bounceOut(t) end

-- ───────────────────────────────────────────────────────────────────────
-- Math Extensions API
-- ───────────────────────────────────────────────────────────────────────

---Extended math functions provided by DuckEngine.
---Accessed via `math.ext.lerp(...)`, `math.ext.clamp(...)`, and `math.ext.easing.*`.
---@class LuaMathExt
---@field easing LuaMathEasing Table of 16 easing functions.
local LuaMathExt = {}

---Linearly interpolates between two values.
---
---Example:
---```lua
---local halfWay = math.ext.lerp(0, 100, 0.5) -- returns 50
---local smooth = math.ext.lerp(curX, targetX, math.ext.easing.quadOut(t))
---```
---@param a number Start value (returned when `t = 0`).
---@param b number End value (returned when `t = 1`).
---@param t number Interpolation factor. `0` = `a`, `1` = `b`. Can exceed `[0, 1]` for extrapolation.
---@return number result The interpolated value: `a + (b - a) * t`.
function LuaMathExt.lerp(a, b, t) end

---Clamps a value between a minimum and maximum bound.
---
---Example:
---```lua
---local health = math.ext.clamp(health - damage, 0, maxHealth)
---local t = math.ext.clamp(elapsed / duration, 0, 1)
---```
---@param v number The value to clamp.
---@param min number The lower bound (inclusive).
---@param max number The upper bound (inclusive).
---@return number clamped The clamped value: `max(min, min(max, v))`.
function LuaMathExt.clamp(v, min, max) end

-- ───────────────────────────────────────────────────────────────────────
-- Global binding
-- ───────────────────────────────────────────────────────────────────────

---@class MathAPI
---The standard Lua `math` library, extended with `math.ext`.
---@field ext LuaMathExt DuckEngine math extensions (lerp, clamp, easing).
math = {}
