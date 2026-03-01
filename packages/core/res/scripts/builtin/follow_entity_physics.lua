-- =======================================================================
-- follow_entity_physics.lua
-- Physics-based entity following using proportional impulses.
-- Requires a RigidBody. The entity accelerates towards the target
-- instead of teleporting, making it interact with obstacles naturally.
-- =======================================================================

---@type ScriptBlueprint<FollowEntityPhysicsProps, any>
return {
    schema = {
        name = "Follow Entity (Physics)",
        description = "Follows a target entity via physics impulses. Requires rigidBody.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to follow." },
            strength       = { type = "number", default = 10, description = "Force multiplier for the attraction." },
            damping        = { type = "number", default = 0.9, description = "Velocity damping factor (0..1). Lower = more damping." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    },

    ---@param self ScriptInstance<FollowEntityPhysicsProps, any>
    ---@param dt number
    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.required flag
        local props    = self.properties
        local target   = props.targetEntityId
        local strength = props.strength
        local offset   = props.offset
        if not offset then return end


        -- 1. Calculate desired world position
        local tp = target:getPosition()
        if not tp then return end

        local desired   = tp + offset

        -- 2. Get direction and distance to desired position
        local cur       = self:getPosition()
        local dir       = desired - cur

        -- 3. Apply proportional impulse (P-controller)
        local secs      = dt / 1000
        self:applyImpulse(dir * strength * secs)
    end
}
