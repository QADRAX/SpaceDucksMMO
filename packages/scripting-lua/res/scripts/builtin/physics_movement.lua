-- Moves a rigidbody using physics-based forces and WASD input.

return {
  name = "Physics Movement",
  description = "WASD + physics. Uses RigidBody.applyForce for motion.",

  properties = {
    moveForce = { type = "number", default = 50, description = "Force magnitude to apply" },
    maxSpeed = { type = "number", default = 10, description = "Terminal velocity" },
    drag = { type = "number", default = 0.5, description = "Air resistance" }
  },

  init = function(self)
    self.velocity = { x = 0, y = 0, z = 0 }
  end,

  update = function(self, dt)
    if not Physics then return end

    -- Read input
    local w = input.isKeyPressed("w")
    local s = input.isKeyPressed("s")
    local a = input.isKeyPressed("a")
    local d = input.isKeyPressed("d")

    -- Build movement vector
    local mv = math.vec3.zero()
    if w then mv.z = -1 end
    if s then mv.z = 1 end
    if a then mv.x = -1 end
    if d then mv.x = 1 end

    -- Normalize and apply force
    if math.vec3.lengthSq(mv) > 0 then
      mv = math.vec3.normalize(mv)
      local force = math.vec3.scale(mv, self.properties.moveForce)
      Physics.applyForce(force)
    end

    -- Apply drag
    self.velocity = math.vec3.scale(self.velocity, 1 - self.properties.drag)
  end
}
