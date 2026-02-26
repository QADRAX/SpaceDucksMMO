-- =======================================================================
-- follow_entity_physics.lua
-- Physics-based entity following using proportional impulses.
-- Requires a RigidBody. The entity accelerates towards the target
-- instead of teleporting, making it interact with obstacles naturally.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Follow Entity (Physics)",
        description = "Follows a target entity via physics impulses. Requires rigidBody.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to follow." },
            strength       = { type = "number", default = 10, description = "Force multiplier for the attraction." },
            damping        = { type = "number", default = 0.9, description = "Velocity damping factor (0..1). Lower = more damping." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    },

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target   = self.targetEntityId

        local props    = self.properties or {}
        local strength = props.strength or 10
        local offset   = props.offset or { 0, 0, 0 }

        -- 1. Calculate desired world position
        local tp       = target:getPosition()
        local desired  = {
            x = tp.x + offset[1],
            y = tp.y + offset[2],
            z = tp.z + offset[3]
        }

        -- 2. Get direction and distance to desired position
        local cur      = self:getPosition()
        local dir      = {
            x = desired.x - cur.x,
            y = desired.y - cur.y,
            z = desired.z - cur.z
        }

        -- 3. Apply proportional impulse (P-controller)
        local secs     = dt / 1000
        self:applyImpulse(
            dir.x * strength * secs,
            dir.y * strength * secs,
            dir.z * strength * secs
        )
    end
}
