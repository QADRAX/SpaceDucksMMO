-- =======================================================================
-- math_ext.lua
-- System library extending standard math functionality with vector types
-- and Object-Oriented metatable behaviors.
-- =======================================================================

---@diagnostic disable-next-line: undefined-global
math.ext = math_ext

-- Inject Object-Oriented Vector API
local Vec3 = {}
Vec3.__index = Vec3

function Vec3:__add(other)
    return math.vec3(self.x + other.x, self.y + other.y, self.z + other.z)
end

function Vec3:__sub(other)
    return math.vec3(self.x - other.x, self.y - other.y, self.z - other.z)
end

function Vec3:__mul(val)
    if type(val) == "number" then
        return math.vec3(self.x * val, self.y * val, self.z * val)
    elseif type(self) == "number" then
        return math.vec3(val.x * self, val.y * self, val.z * self)
    end
    -- Element-wise vector multiplication
    return math.vec3(self.x * val.x, self.y * val.y, self.z * val.z)
end

function Vec3:__div(val)
    if type(val) == "number" then
        return math.vec3(self.x / val, self.y / val, self.z / val)
    end
    -- Element-wise vector division
    return math.vec3(self.x / val.x, self.y / val.y, self.z / val.z)
end

function Vec3:__unm()
    return math.vec3(-self.x, -self.y, -self.z)
end

function Vec3:__eq(other)
    local epsilon = 1e-6
    return math.abs(self.x - other.x) < epsilon and
        math.abs(self.y - other.y) < epsilon and
        math.abs(self.z - other.z) < epsilon
end

function Vec3:__tostring()
    return string.format("Vec3(%.3f, %.3f, %.3f)", self.x, self.y, self.z)
end

function Vec3:lengthSq()
    return self.x * self.x + self.y * self.y + self.z * self.z
end

function Vec3:length()
    return math.sqrt(self:lengthSq())
end

function Vec3:normalize()
    local len = self:length()
    if len > 0 then
        return math.vec3(self.x / len, self.y / len, self.z / len)
    end
    return math.vec3(0, 0, 0)
end

function Vec3:dot(other)
    return self.x * other.x + self.y * other.y + self.z * other.z
end

function Vec3:cross(other)
    return math.vec3(
        self.y * other.z - self.z * other.y,
        self.z * other.x - self.x * other.z,
        self.x * other.y - self.y * other.x
    )
end

function Vec3:distanceTo(other)
    local dx = self.x - other.x
    local dy = self.y - other.y
    local dz = self.z - other.z
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

function Vec3:clone()
    return math.vec3(self.x, self.y, self.z)
end

function Vec3:lerp(other, t)
    return math.vec3(
        self.x + (other.x - self.x) * t,
        self.y + (other.y - self.y) * t,
        self.z + (other.z - self.z) * t
    )
end

function Vec3:reflect(normal)
    local d = 2 * self:dot(normal)
    return math.vec3(self.x - d * normal.x, self.y - d * normal.y, self.z - d * normal.z)
end

function Vec3:project(other)
    local d = other:dot(other)
    if d < 1e-12 then return math.vec3(0, 0, 0) end
    local s = self:dot(other) / d
    return math.vec3(other.x * s, other.y * s, other.z * s)
end

function Vec3:angleTo(other)
    local d = self:dot(other)
    local lenProduct = self:length() * other:length()
    if lenProduct < 1e-12 then return 0 end
    local cosAngle = math.ext.clamp(d / lenProduct, -1, 1)
    return math.acos(cosAngle)
end

function Vec3:min(other)
    return math.vec3(math.min(self.x, other.x), math.min(self.y, other.y), math.min(self.z, other.z))
end

function Vec3:max(other)
    return math.vec3(math.max(self.x, other.x), math.max(self.y, other.y), math.max(self.z, other.z))
end

function Vec3:abs()
    return math.vec3(math.abs(self.x), math.abs(self.y), math.abs(self.z))
end

function Vec3:floor()
    return math.vec3(math.floor(self.x), math.floor(self.y), math.floor(self.z))
end

function Vec3:ceil()
    return math.vec3(math.ceil(self.x), math.ceil(self.y), math.ceil(self.z))
end

function Vec3:set(x, y, z)
    self.x = x or self.x
    self.y = y or self.y
    self.z = z or self.z
    return self
end

function Vec3:toArray()
    return { self.x, self.y, self.z }
end

-- smoothDamp: spring-damper smooth interpolation (returns value, newVelocity)
if math.ext then
    function math.ext.smoothDamp(current, target, velocity, smoothTime, dt, maxSpeed)
        smoothTime = math.max(0.0001, smoothTime)
        maxSpeed = maxSpeed or math.huge
        local omega = 2.0 / smoothTime
        local x = omega * dt
        local exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x)
        local change = current - target
        local maxChange = maxSpeed * smoothTime
        change = math.ext.clamp(change, -maxChange, maxChange)
        local temp = (velocity + omega * change) * dt
        local newVelocity = (velocity - omega * temp) * exp
        local result = (current - change) + (change + temp) * exp
        -- Prevent overshoot
        if (target - current > 0) == (result > target) then
            result = target
            newVelocity = (result - target) / dt
        end
        return result, newVelocity
    end
end

--- Calls an easing function by name.
--- Avoids storing a JS function reference in a local variable, which can
--- lose its callable status across the wasmoon Lua↔JS boundary.
--- Falls back to an inline smoothstep if the easing table or name is missing.
---@param name string  Easing function name (e.g. "quadOut", "sineOut").
---@param t    number  Normalised time value [0, 1].
---@return number
function math.ext.ease(name, t)
    local easings = math.ext.easing
    if easings then
        local fn = easings[name]
        if fn then return fn(t) end
        if easings.smoothstep then return easings.smoothstep(t) end
    end
    -- Inline smoothstep fallback
    return t * t * (3 - 2 * t)
end

-- Constructor function
math.vec3 = setmetatable({
    zero    = function() return math.vec3(0, 0, 0) end,
    one     = function() return math.vec3(1, 1, 1) end,
    up      = function() return math.vec3(0, 1, 0) end,
    down    = function() return math.vec3(0, -1, 0) end,
    left    = function() return math.vec3(-1, 0, 0) end,
    right   = function() return math.vec3(1, 0, 0) end,
    forward = function() return math.vec3(0, 0, -1) end,
    back    = function() return math.vec3(0, 0, 1) end
}, {
    __call = function(_, x, y, z)
        local t = { x = x or 0, y = y or 0, z = z or 0 }
        setmetatable(t, Vec3)
        return t
    end
})
