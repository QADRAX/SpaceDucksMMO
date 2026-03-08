-- Rotates the entity continuously around a world axis.

return {
  name = "Continuous Rotator",
  description = "Rotates entity around a world axis.",

  properties = {
    rotationSpeed = { type = "number", default = 45, description = "Rotation speed in degrees per second" },
    axis = { type = "string", default = "y", description = "Axis to rotate around: x, y, or z" }
  },

  update = function(self, dt)
    if not Transform then return end

    local speed = self.properties.rotationSpeed
    local axis = self.properties.axis

    -- Convert to radians per frame
    local radPerFrame = math.rad(speed) * dt

    -- Get current rotation as Euler angles, apply delta, convert back
    -- (Simplified: in production, this would use quaternion math to avoid gimbal lock)
    if axis == "x" then
      Transform.rotate(radPerFrame, 0, 0)
    elseif axis == "y" then
      Transform.rotate(0, radPerFrame, 0)
    elseif axis == "z" then
      Transform.rotate(0, 0, radPerFrame)
    end
  end
}
