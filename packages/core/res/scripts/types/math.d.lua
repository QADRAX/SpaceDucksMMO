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
---| "elasticIn"    # Elastic ease-in. Overshoots before settling.
---| "elasticOut"   # Elastic ease-out. Overshoots before settling.
---| "elasticInOut" # Elastic ease-in-out. Overshoots on both ends.
---| "backIn"       # Back ease-in. Pulls back before accelerating.
---| "backOut"      # Back ease-out. Overshoots then returns.
---| "backInOut"    # Back ease-in-out. Pull-back and overshoot.

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

---Elastic ease-in. Spring-like overshoot before reaching the target.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.elasticIn(t) end

---Elastic ease-out. Overshoots and oscillates before settling.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.elasticOut(t) end

---Elastic ease-in-out. Spring-like overshoot on both ends.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.elasticInOut(t) end

---Back ease-in. Pulls back before accelerating forward.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.backIn(t) end

---Back ease-out. Overshoots target then returns.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.backOut(t) end

---Back ease-in-out. Pull-back start and overshoot end.
---@param t number Normalized time `[0, 1]`.
---@return number eased The eased value.
function LuaMathEasing.backInOut(t) end

-- ───────────────────────────────────────────────────────────────────────
-- Math Extensions API
-- ───────────────────────────────────────────────────────────────────────

---Extended math functions provided by DuckEngine.
---Accessed via `math.ext.lerp(...)`, `math.ext.clamp(...)`, and `math.ext.easing.*`.
---@class LuaMathExt
---@field easing LuaMathEasing Table of 22 easing functions.
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

---Returns the inverse-lerp parameter t for a value in the range [a, b].
---Result is clamped to [0, 1].
---@param a number Range start.
---@param b number Range end.
---@param v number The value to evaluate.
---@return number t The interpolation parameter.
function LuaMathExt.inverseLerp(a, b, v) end

---Remaps a value from one range to another.
---@param v number The input value.
---@param inMin number Input range start.
---@param inMax number Input range end.
---@param outMin number Output range start.
---@param outMax number Output range end.
---@return number result The remapped value.
function LuaMathExt.remap(v, inMin, inMax, outMin, outMax) end

---Returns a random number in the range [min, max).
---@param min number Range start (inclusive).
---@param max number Range end (exclusive).
---@return number result Random value.
function LuaMathExt.randomRange(min, max) end

---Returns the sign of a value: -1, 0, or 1.
---@param v number The value.
---@return number sign -1, 0, or 1.
function LuaMathExt.sign(v) end

---Moves `current` towards `target` by at most `maxDelta`.
---@param current number Current value.
---@param target number Target value.
---@param maxDelta number Maximum change per call.
---@return number result The new value.
function LuaMathExt.moveTowards(current, target, maxDelta) end

---Returns a value that oscillates between 0 and `length` as `t` increases.
---@param t number Input value (typically elapsed time).
---@param length number Half-period length.
---@return number result Oscillating value in [0, length].
function LuaMathExt.pingPong(t, length) end

---Wraps `t` into the range [0, length) using modular arithmetic.
---@param t number Input value.
---@param length number Range length.
---@return number result Wrapped value.
function LuaMathExt.wrapRepeat(t, length) end

---Smoothly interpolates a value towards a target using a spring-damper model.
---Returns two values: the new position and the new velocity.
---@param current number Current value.
---@param target number Target value.
---@param velocity number Current velocity (pass 0 on first call).
---@param smoothTime number Approximate time to reach the target.
---@param dt number Frame delta time.
---@param maxSpeed? number Optional maximum speed. Default: infinity.
---@return number value The smoothed value.
---@return number velocity The new velocity (pass back on next frame).
function LuaMathExt.smoothDamp(current, target, velocity, smoothTime, dt, maxSpeed) end

---Calls an easing function by name.
---Falls back to an inline smoothstep if the easing table or name is missing.
---@param name string Easing function name (e.g. "quadOut", "sineOut").
---@param t number Normalised time value [0, 1].
---@return number
function LuaMathExt.ease(name, t) end

-- ───────────────────────────────────────────────────────────────────────
-- Vec3 Object API
-- ───────────────────────────────────────────────────────────────────────

---A 3-component vector used for mathematical operations, positions, and rotations.
---@class Vec3
---@field x number
---@field y number
---@field z number
---@operator add(Vec3|number): Vec3
---@operator sub(Vec3): Vec3
---@operator mul(Vec3|number): Vec3
---@operator div(Vec3|number): Vec3
---@operator unm: Vec3
local Vec3 = {}

---Returns the magnitude (length) of the vector.
---@return number length
function Vec3:length() end

---Returns the squared magnitude of the vector (faster than length()).
---@return number lengthSq
function Vec3:lengthSq() end

---Returns a newly allocated, normalized clone of this vector.
---@return Vec3 normalized
function Vec3:normalize() end

---Calculates the Euclidean distance to another vector.
---@param other Vec3
---@return number distance
function Vec3:distanceTo(other) end

---Calculates the dot product with another vector.
---@param other Vec3
---@return number dot
function Vec3:dot(other) end

---Calculates the cross product with another vector.
---@param other Vec3
---@return Vec3 cross
function Vec3:cross(other) end

---Clones this vector.
---@return Vec3 clone
function Vec3:clone() end

---Linearly interpolates between this vector and another.
---@param other Vec3 Target vector.
---@param t number Interpolation factor [0, 1].
---@return Vec3 result Interpolated vector.
function Vec3:lerp(other, t) end

---Reflects this vector off a surface with the given normal.
---@param normal Vec3 Surface normal (should be normalized).
---@return Vec3 result Reflected vector.
function Vec3:reflect(normal) end

---Projects this vector onto another vector.
---@param other Vec3 The vector to project onto.
---@return Vec3 result Projected vector.
function Vec3:project(other) end

---Returns the angle in radians between this vector and another.
---@param other Vec3
---@return number angle Angle in radians.
function Vec3:angleTo(other) end

---Returns a vector with the component-wise minimum of this and another vector.
---@param other Vec3
---@return Vec3 result
function Vec3:min(other) end

---Returns a vector with the component-wise maximum of this and another vector.
---@param other Vec3
---@return Vec3 result
function Vec3:max(other) end

---Returns a vector with the absolute value of each component.
---@return Vec3 result
function Vec3:abs() end

---Returns a vector with each component floored.
---@return Vec3 result
function Vec3:floor() end

---Returns a vector with each component ceiled.
---@return Vec3 result
function Vec3:ceil() end

---Sets the components of this vector in-place. Returns self for chaining.
---@param x? number New x value (nil keeps current).
---@param y? number New y value (nil keeps current).
---@param z? number New z value (nil keeps current).
---@return Vec3 self
function Vec3:set(x, y, z) end

---Converts this vector to a flat array {x, y, z}.
---@return number[] array
function Vec3:toArray() end

-- ───────────────────────────────────────────────────────────────────────
-- Global binding
-- ───────────────────────────────────────────────────────────────────────

---@class MathVec3Constructor
---@field zero fun(): Vec3
---@field one fun(): Vec3
---@field up fun(): Vec3
---@field down fun(): Vec3
---@field left fun(): Vec3
---@field right fun(): Vec3
---@field forward fun(): Vec3
---@field back fun(): Vec3

---@class MathAPI
---The standard Lua `math` library, extended with `math.ext` and `math.vec3`.
---@field ext LuaMathExt DuckEngine math extensions (lerp, clamp, easing).
---@field vec3 fun(x: number|nil, y: number|nil, z: number|nil): Vec3 Retrieves a new Vec3 object. Call as `math.vec3(x, y, z)`. Can also access constant factories e.g., `math.vec3.zero()`.
math = {}

-- Note: In EmmyLua, fields on callables are best handled through intersects or unions.
-- For autocomplete, we manually define math.vec3 constant factories here:
math.vec3 = {}
---@return Vec3 zero
math.vec3.zero = function() return {} end
---@return Vec3 one
math.vec3.one = function() return {} end
---@return Vec3 up
math.vec3.up = function() return {} end
---@return Vec3 down
math.vec3.down = function() return {} end
---@return Vec3 left
math.vec3.left = function() return {} end
---@return Vec3 right
math.vec3.right = function() return {} end
---@return Vec3 forward
math.vec3.forward = function() return {} end
---@return Vec3 back
math.vec3.back = function() return {} end

