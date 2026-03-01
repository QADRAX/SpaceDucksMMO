-- =======================================================================
-- rotate_continuous.lua
-- Continuously rotates the entity at a constant speed on each axis.
-- Speed is specified in degrees per second for each axis.
-- =======================================================================

---@type ScriptBlueprint<RotateContinuousProps, {}>
return {
    schema = {
        name = "Rotate Continuous",
        description = "Spins the entity at a constant rate in degrees per second.",
        properties = {
            speedX = { type = "number", default = 0,  description = "Rotation speed around the X axis (degrees/sec)." },
            speedY = { type = "number", default = 45, description = "Rotation speed around the Y axis (degrees/sec)." },
            speedZ = { type = "number", default = 0,  description = "Rotation speed around the Z axis (degrees/sec)." }
        }
    },

    ---@param self ScriptInstance<RotateContinuousProps, {}>
    ---@param dt number
    update = function(self, dt)
        local props = self.properties
        local toRad = math.pi / 180
        local rot   = self:getRotation()

        rot.x = rot.x + props.speedX * toRad * dt
        rot.y = rot.y + props.speedY * toRad * dt
        rot.z = rot.z + props.speedZ * toRad * dt

        self:setRotation(rot)
    end
}
