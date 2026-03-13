---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Math Extensions
-- Extended math library with vector operations, interpolation, and easing.
-- ═══════════════════════════════════════════════════════════════════════

---A 3-component vector for positions, directions, and scales.
---@class Vec3V2
---@field x number X component.
---@field y number Y component.
---@field z number Z component.
local Vec3V2 = {}

---Returns the magnitude (length) of the vector.
---@return number length
function Vec3V2:length() end

---Returns the squared magnitude (faster than length).
---@return number lengthSq
function Vec3V2:lengthSq() end

---Returns a normalized copy of this vector.
---@return Vec3V2 normalized
function Vec3V2:normalize() end

---Calculates the dot product with another vector.
---@param other Vec3V2
---@return number dot
function Vec3V2:dot(other) end

---Calculates the cross product with another vector.
---@param other Vec3V2
---@return Vec3V2 cross
function Vec3V2:cross(other) end

---Calculates the Euclidean distance to another vector.
---@param other Vec3V2
---@return number distance
function Vec3V2:distanceTo(other) end

---Returns a clone of this vector.
---@return Vec3V2 clone
function Vec3V2:clone() end

---Linearly interpolates towards another vector.
---@param other Vec3V2 Target vector.
---@param t number Interpolation factor [0, 1].
---@return Vec3V2 result
function Vec3V2:lerp(other, t) end

---Converts this vector to an array {x, y, z}.
---@return number[] array
function Vec3V2:toArray() end

---A 2-component vector for screen space operations.
---@class Vec2V2
---@field x number X component.
---@field y number Y component.
local Vec2V2 = {}

---A quaternion for rotation representation.
---@class QuatV2
---@field x number X component.
---@field y number Y component.
---@field z number Z component.
---@field w number W component.
local QuatV2 = {}

---Math extensions: lerp, clamp, easing functions.
---@class MathExtV2
math.ext = {}

---Linearly interpolates between two values.
---@param a number Start value.
---@param b number End value.
---@param t number Interpolation factor [0, 1].
---@return number result
function math.ext.lerp(a, b, t) end

---Clamps a value between min and max.
---@param v number Value to clamp.
---@param lo number Lower bound (inclusive).
---@param hi number Upper bound (inclusive).
---@return number clamped
function math.ext.clamp(v, lo, hi) end

---Inverse lerp: find t for value v in range [a, b].
---@param a number Range start.
---@param b number Range end.
---@param v number Value to evaluate.
---@return number t
function math.ext.inverseLerp(a, b, v) end

---Remaps a value from one range to another.
---@param iLo number Input range start.
---@param iHi number Input range end.
---@param oLo number Output range start.
---@param oHi number Output range end.
---@param v number Value to remap.
---@return number result
function math.ext.remap(iLo, iHi, oLo, oHi, v) end

---Returns the sign of a value: -1, 0, or 1.
---@param x number
---@return number sign
function math.ext.sign(x) end

---Moves a value towards a target by at most maxDelta.
---@param current number Current value.
---@param target number Target value.
---@param maxDelta number Max change per call.
---@return number result
function math.ext.moveTowards(current, target, maxDelta) end

---Vec3 constructor and constants.
---@class Vec3ConstructorV2
math.vec3 = {}

---Create a new Vec3V2.
---@param x number|nil X component (default 0).
---@param y number|nil Y component (default 0).
---@param z number|nil Z component (default 0).
---@return Vec3V2
function math.vec3.new(x, y, z) end

---Zero vector (0, 0, 0).
---@return Vec3V2
function math.vec3.zero() end

---One vector (1, 1, 1).
---@return Vec3V2
function math.vec3.one() end

---Up vector (0, 1, 0).
---@return Vec3V2
function math.vec3.up() end

---Down vector (0, -1, 0).
---@return Vec3V2
function math.vec3.down() end

---Left vector (-1, 0, 0).
---@return Vec3V2
function math.vec3.left() end

---Right vector (1, 0, 0).
---@return Vec3V2
function math.vec3.right() end

---Forward vector (0, 0, 1).
---@return Vec3V2
function math.vec3.forward() end

---Back vector (0, 0, -1).
---@return Vec3V2
function math.vec3.back() end

---Easing functions for smooth animations.
---@class EasingFunctionsV2
math.ext.easing = {}

---Linear easing: no acceleration.
---@param t number Normalized time [0, 1].
---@return number eased
function math.ext.easing.linear(t) end

---Smoothstep easing: Hermite interpolation.
---@param t number Normalized time [0, 1].
---@return number eased
function math.ext.easing.smoothstep(t) end

---Quadratic ease-in.
---@param t number Normalized time [0, 1].
---@return number eased
function math.ext.easing.quadIn(t) end

---Quadratic ease-out.
---@param t number Normalized time [0, 1].
---@return number eased
function math.ext.easing.quadOut(t) end

---Cubic ease-in.
---@param t number Normalized time [0, 1].
---@return number eased
function math.ext.easing.cubicIn(t) end

---Cubic ease-out.
---@param t number Normalized time [0, 1].
---@return number eased
function math.ext.easing.cubicOut(t) end

---Sinusoidal ease-in.
---@param t number Normalized time [0, 1].
---@return number eased
function math.ext.easing.sineIn(t) end

---Sinusoidal ease-out.
---@param t number Normalized time [0, 1].
---@return number eased
function math.ext.easing.sineOut(t) end
