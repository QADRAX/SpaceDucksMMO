-- =======================================================================
-- destroy_after.lua (V2)
-- Self-destructs the entity after a configurable lifetime.
-- Uses Scene.destroy(entityId) which is processed after frame hooks.
-- =======================================================================

---@class DestroyAfterPropsV2
---@field lifetime number Seconds until self-destruct. Default: 5.

---@class DestroyAfterStateV2
---@field timer number Elapsed time since init.

---@class DestroyAfterScript : ScriptInstanceV2
---@field properties DestroyAfterPropsV2
---@field state DestroyAfterStateV2
local DestroyAfter = {
    schema = {
        name = "Destroy After (V2)",
        description = "Automatically destroys this entity after a given number of seconds.",
        properties = {
            lifetime = { type = "number", default = 5, description = "Seconds until self-destruct." }
        }
    }
}

function DestroyAfter:init()
    self.state = {
        timer = 0
    }
end

function DestroyAfter:update(dt)
    self.state.timer = self.state.timer + dt
    if self.state.timer >= self.properties.lifetime then
        self.Scene.destroy(self.entity.id)
    end
end

return DestroyAfter
