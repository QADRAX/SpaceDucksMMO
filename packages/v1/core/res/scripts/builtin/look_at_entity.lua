-- =======================================================================
-- look_at_entity.lua
-- Smoothly rotates the entity to face a target entity.
-- Only affects rotation — does NOT move the entity.
-- =======================================================================

---@type ScriptBlueprint<LookAtEntityProps, any>
return {
    schema = {
        name = "Look at Entity",
        description = "Smoothly rotates this entity to face a target entity. Rotation only.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 5, description = "Rotation smoothing speed." },
            lookAtOffset   = { type = "vec3", default = { 0, 0, 0 }, description = "World-space offset applied to the target position." }
        }
    },

    ---@param self ScriptInstance<LookAtEntityProps, any>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local target = props.targetEntityId
        if not target then return end


        local tp = target:getPosition()
        if not tp then return end

        local offset = props.lookAtOffset
        if not offset then return end
        self:lookAt(tp + offset)
    end
}
