-- =======================================================================
-- smooth_look_at.lua
-- Eased rotation towards a target entity. Instead of snapping instantly,
-- the entity smoothly rotates over a configurable duration using an
-- easing curve. Useful for turrets, cinematic cameras, and NPCs.
-- =======================================================================

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

---@class SmoothLookAtState
---@field lastAngle number?

---@type ScriptBlueprint<SmoothLookAtProps, SmoothLookAtState>
return {
    schema = {
        name = "Smooth Look At",
        description = "Smoothly rotates to face a target using easing curves.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to look at." },

            speed          = { type = "number", default = 3, description = "Rotation speed (higher = faster convergence)." },
            easing         = { type = "string", default = "sineOut", description = "Easing function: sineOut, quadOut, cubicInOut, etc." },
            offset         = { type = "vec3", default = { 0, 0, 0 }, description = "Offset applied to target position." }
        }
    },

    ---@param self ScriptInstance<SmoothLookAtProps, SmoothLookAtState>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local target = props.targetEntityId
        local speed  = props.speed or 3

        local offset = props.offset

        local tp     = target:getPosition()
        if not tp then return end
        local cur            = self:getPosition()

        -- Direction from self to target+offset
        local desired        = offset and (tp + offset) or tp
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
        local t              = math.ext.ease(props.easing or "sineOut", raw)

        -- Smoothly interpolate angles
        local newPitch       = lerpAngle(rot.x, desiredPitch, t)
        local newYaw         = lerpAngle(rot.y, desiredYaw, t)

        self:setRotation(math.vec3(newPitch, newYaw, 0))
    end
}
