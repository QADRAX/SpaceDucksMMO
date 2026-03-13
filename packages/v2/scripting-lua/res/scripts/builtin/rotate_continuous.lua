-- =======================================================================
-- rotate_continuous.lua (V2)
-- Continuously rotates the entity at a constant speed on each axis.
-- Speed is specified in degrees per second for each axis.
-- =======================================================================

---@class RotateContinuousPropsV2
---@field speedX number Rotation speed around X axis (degrees/sec). Default: 0.
---@field speedY number Rotation speed around Y axis (degrees/sec). Default: 45.
---@field speedZ number Rotation speed around Z axis (degrees/sec). Default: 0.

---@class RotateContinuousScript : ScriptInstanceV2
---@field properties RotateContinuousPropsV2
local RotateContinuous = {
    schema = {
        name = "Rotate Continuous (V2)",
        description = "Spins the entity at a constant rate in degrees per second.",
        properties = {
            speedX = { type = "number", default = 0,  description = "Rotation speed around the X axis (degrees/sec)." },
            speedY = { type = "number", default = 45, description = "Rotation speed around the Y axis (degrees/sec)." },
            speedZ = { type = "number", default = 0,  description = "Rotation speed around the Z axis (degrees/sec)." }
        }
    }
}

function RotateContinuous:update(dt)
    local props = self.properties
    local toRad = math.pi / 180
    local rot = self.entity.components.transform.getRotation()

    rot.x = rot.x + props.speedX * toRad * dt
    rot.y = rot.y + props.speedY * toRad * dt
    rot.z = rot.z + props.speedZ * toRad * dt

    self.entity.components.transform.setRotation(rot)
end

return RotateContinuous
