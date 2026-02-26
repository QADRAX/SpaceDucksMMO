-- =======================================================================
-- look_at_entity.lua
-- Smoothly rotates the entity to face a target entity.
-- Only affects rotation — does NOT move the entity.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Look at Entity",
        description = "Smoothly rotates this entity to face a target entity. Rotation only.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 5, description = "Rotation smoothing speed." },
            lookAtOffset   = { type = "vec3", default = { 0, 0, 0 }, description = "World-space offset applied to the target position." }
        }
    },

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target = self.targetEntityId

        local tp     = target:getPosition()
        if not tp then return end

        local props     = self.properties or {}
        local offset    = props.lookAtOffset or { 0, 0, 0 }
        local offsetVec = math.vec3(offset[1], offset[2], offset[3])

        self:lookAt(tp + offsetVec)
    end
}
