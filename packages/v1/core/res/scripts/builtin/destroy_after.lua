-- =======================================================================
-- destroy_after.lua
-- Self-destructs the entity after a configurable lifetime.
-- Uses self:destroy() which calls scene.destroyEntity(self.id).
-- =======================================================================

---@class DestroyAfterState
---@field timer number

---@type ScriptBlueprint<DestroyAfterProps, DestroyAfterState>
return {
    schema = {
        name = "Destroy After",
        description = "Automatically destroys this entity after a given number of seconds.",
        properties = {
            lifetime = { type = "number", default = 5, description = "Seconds until self-destruct." }
        }
    },

    ---@param self ScriptInstance<DestroyAfterProps, DestroyAfterState>
    init = function(self)
        self.state.timer = 0
    end,

    ---@param self ScriptInstance<DestroyAfterProps, DestroyAfterState>
    ---@param dt number
    update = function(self, dt)
        self.state.timer = self.state.timer + dt
        if self.state.timer >= self.properties.lifetime then
            self:destroy()
        end
    end
}
