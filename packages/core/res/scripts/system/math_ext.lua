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
