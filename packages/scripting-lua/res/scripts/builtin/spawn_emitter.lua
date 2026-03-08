-- Simple periodic emitter spawning copies of this entity.

return {
  name = "Spawn Emitter",
  description = "Spawns copies of the entity at regular intervals.",

  properties = {
    spawnInterval = { type = "number", default = 1.0, description = "Time between spawns (seconds)" },
    spawnOffset = { type = "number", default = 1.0, description = "World distance from this entity to spawn" },
    maxSpawns = { type = "number", default = 10, description = "Max total spawns before stopping" }
  },

  init = function(self)
    self.elapsed = 0
    self.spawnCount = 0
  end,

  update = function(self, dt)
    if self.spawnCount >= self.properties.maxSpawns then
      return
    end

    self.elapsed = self.elapsed + dt
    if self.elapsed >= self.properties.spawnInterval then
      -- In a real implementation, Scene.instantiate would be called here
      if Scene and Scene.broadcast then
        Scene.broadcast("entity:spawn_requested", {})
      end
      self.spawnCount = self.spawnCount + 1
      self.elapsed = 0
    end
  end
}
