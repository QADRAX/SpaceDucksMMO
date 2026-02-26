-- =======================================================================
-- smooth_look_at.lua
-- Eased rotation towards a target entity. Instead of snapping instantly,
-- the entity smoothly rotates over a configurable duration using an
-- easing curve. Useful for turrets, cinematic cameras, and NPCs.
-- =======================================================================

---Selects an easing function by name, falling back to smoothstep.
---@param name string
---@return fun(t: number): number
local function getEasing(name)
    local fn = math.ext.easing[name]
    if fn then return fn end
    return math.ext.easing.smoothstep
end

---Interpolates between two Euler rotation values, handling wrap-around.
---@param a number
---@param b number
---@param t number
---@return number
local function lerpAngle(a, b, t)
    local diff = b - a
    -- Normalize to -pi..pi
    while diff > math.pi do diff = diff - 2 * math.pi end
    while diff < -math.pi do diff = diff + 2 * math.pi end
    return a + diff * t
end

---@type ScriptModule
return {
    schema = {
        name = "Smooth Look At",
        description = "Smoothly rotates to face a target using easing curves.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 3, description = "Rotation speed (higher = faster convergence)." },
            easing         = { type = "string", default = "sineOut", description = "Easing function: sineOut, quadOut, cubicInOut, etc." },
            offset         = { type = "vec3", default = { 0, 0, 0 }, description = "Offset applied to target position." }
        }
    },

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target = self.targetEntityId

        local props  = self.properties or {}
        local speed  = props.speed or 3
        local ease   = getEasing(props.easing or "sineOut")
        local offset = props.offset or { 0, 0, 0 }

        local tp     = target:getPosition()
        if not tp then return end
        local cur            = self:getPosition()

        -- Direction from self to target+offset
        local offsetVec      = math.vec3(offset[1], offset[2], offset[3])
        local desired        = tp + offsetVec
        local dir            = desired - cur

        -- Calculate desired yaw and pitch from direction
        local desiredYaw     = math.atan(dir.x, dir.z)
        local horizontalDist = math.sqrt(dir.x * dir.x + dir.z * dir.z)
        local desiredPitch   = -math.atan(dir.y, horizontalDist)

        -- Get current rotation
        local rot            = self:getRotation()

        -- Calculate interpolation factor with easing
        local secs           = dt / 1000
        local raw            = math.ext.clamp(speed * secs, 0, 1)
        local t              = ease(raw)

        -- Smoothly interpolate angles
        local newPitch       = lerpAngle(rot.x, desiredPitch, t)
        local newYaw         = lerpAngle(rot.y, desiredYaw, t)

        self:setRotation(math.vec3(newPitch, newYaw, 0))
    end
}
