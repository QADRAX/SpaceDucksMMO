-- Lua math extensions for the scripting sandbox.
-- Provides vec3 as a callable table with operator overloading + static helpers,
-- and math.ext utilities (lerp, clamp, easing functions, etc.).
---@diagnostic disable: duplicate-set-field


--- Vec3 metatable with arithmetic operators and methods.
local Vec3MT = {}
Vec3MT.__index = Vec3MT

function Vec3MT:length()
  return math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)
end

function Vec3MT:normalize()
  local len = self:length()
  if len == 0 then return math3.vec3(0, 0, 0) end
  return math3.vec3(self.x / len, self.y / len, self.z / len)
end

function Vec3MT:dot(other)
  return self.x * other.x + self.y * other.y + self.z * other.z
end

function Vec3MT:cross(other)
  return math3.vec3(
    self.y * other.z - self.z * other.y,
    self.z * other.x - self.x * other.z,
    self.x * other.y - self.y * other.x
  )
end

function Vec3MT:distanceTo(other)
  local dx = self.x - other.x
  local dy = self.y - other.y
  local dz = self.z - other.z
  return math.sqrt(dx * dx + dy * dy + dz * dz)
end

function Vec3MT:clone()
  return math3.vec3(self.x, self.y, self.z)
end

function Vec3MT:lerp(other, t)
  return math3.vec3(
    self.x + (other.x - self.x) * t,
    self.y + (other.y - self.y) * t,
    self.z + (other.z - self.z) * t
  )
end

function Vec3MT:toArray()
  return { self.x, self.y, self.z }
end

Vec3MT.__add      = function(a, b) return math3.vec3(a.x + b.x, a.y + b.y, a.z + b.z) end
Vec3MT.__sub      = function(a, b) return math3.vec3(a.x - b.x, a.y - b.y, a.z - b.z) end
Vec3MT.__mul      = function(a, b)
  if type(a) == "number" then return math3.vec3(a * b.x, a * b.y, a * b.z) end
  if type(b) == "number" then return math3.vec3(a.x * b, a.y * b, a.z * b) end
  return math3.vec3(a.x * b.x, a.y * b.y, a.z * b.z)
end
Vec3MT.__unm      = function(a) return math3.vec3(-a.x, -a.y, -a.z) end
Vec3MT.__eq       = function(a, b) return a.x == b.x and a.y == b.y and a.z == b.z end
Vec3MT.__tostring = function(v)
  return string.format("vec3(%.4f, %.4f, %.4f)", v.x, v.y, v.z)
end

--- Internal constructor: creates a Vec3 instance.
local function newVec3(x, y, z)
  return setmetatable({ x = x or 0, y = y or 0, z = z or 0 }, Vec3MT)
end

--- Expose math.vec3 as a callable table so we can attach static helpers.
--- Scripts call `math.vec3(x, y, z)` via __call, and access statics like
--- `math.vec3.zero()` as regular table fields.
math3 = {
  vec3 = setmetatable({
    -- Static constructors
    zero    = function() return newVec3(0, 0, 0) end,
    one     = function() return newVec3(1, 1, 1) end,
    up      = function() return newVec3(0, 1, 0) end,
    forward = function() return newVec3(0, 0, -1) end,
    right   = function() return newVec3(1, 0, 0) end,
  }, {
    -- Calling math.vec3(x, y, z) creates a new Vec3
    __call = function(_, x, y, z) return newVec3(x, y, z) end,
  }),
}

-- Also alias on math table for backward compat (math.vec3 = math3.vec3)
math.vec3 = math3.vec3

--- Math extensions.
math.ext = {}

function math.ext.lerp(a, b, t) return a + (b - a) * t end

function math.ext.clamp(v, lo, hi) return math.max(lo, math.min(hi, v)) end

function math.ext.inverseLerp(a, b, v) return (v - a) / (b - a) end

function math.ext.sign(x) return x > 0 and 1 or (x < 0 and -1 or 0) end

function math.ext.remap(iLo, iHi, oLo, oHi, v)
  local t = math.ext.inverseLerp(iLo, iHi, v)
  return math.ext.lerp(oLo, oHi, t)
end

function math.ext.moveTowards(current, target, maxDelta)
  local diff = target - current
  if math.abs(diff) <= maxDelta then return target end
  return current + math.ext.sign(diff) * maxDelta
end

--- Easing functions.
math.ext.easing = {}
function math.ext.easing.linear(t) return t end

function math.ext.easing.smoothstep(t) return t * t * (3 - 2 * t) end

function math.ext.easing.quadIn(t) return t * t end

function math.ext.easing.quadOut(t) return t * (2 - t) end

function math.ext.easing.cubicIn(t) return t * t * t end

function math.ext.easing.cubicOut(t)
  local u = 1 - t; return 1 - u * u * u
end

function math.ext.easing.sineIn(t) return 1 - math.cos(t * math.pi / 2) end

function math.ext.easing.sineOut(t) return math.sin(t * math.pi / 2) end
