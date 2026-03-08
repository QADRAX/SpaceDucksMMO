-- Debug logging helper for inspecting game state.
-- Logs entity position, rotation, and scale once per frame.

return {
  name = "Debug Logger",
  description = "Logs entity transform and bridge state.",

  properties = {
    logInterval = { type = "number", default = 1.0, description = "Time between logs (seconds)" }
  },

  init = function(self)
    self.elapsed = 0
  end,

  update = function(self, dt)
    self.elapsed = self.elapsed + dt

    if self.elapsed >= self.properties.logInterval then
      if Transform then
        local pos = Transform.position
        local rot = Transform.rotation
        print(string.format(
          "Entity: pos=(%.2f, %.2f, %.2f) rot=(%.2f, %.2f, %.2f, %.2f)",
          pos.x, pos.y, pos.z, rot.x, rot.y, rot.z, rot.w
        ))
      end
      self.elapsed = 0
    end
  end
}
