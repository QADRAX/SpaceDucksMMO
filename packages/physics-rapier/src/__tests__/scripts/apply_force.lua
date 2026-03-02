---@meta
-- =======================================================================
-- apply_force.lua
-- Test script that applies force to a rigid body on a specific frame
-- =======================================================================

---@class ApplyForceProps
---@field forceX number Force X component in Newtons
---@field forceY number Force Y component in Newtons
---@field forceZ number Force Z component in Newtons
---@field impulse boolean If true, apply as instant impulse; otherwise apply continuous force
---@field applyAtFrame number Frame number on which to apply the force (1-indexed)

---@class ApplyForceState
---@field frameCount number Current frame counter
---@field applied boolean Whether the force has been applied yet

---@class ApplyForceScript : DuckEntity<ApplyForceProps, ApplyForceState>

---@type ScriptModule<ApplyForceScript>
return {
    schema = {
        name = "Apply Force",
        description = "Applies a force or impulse to the rigid body",
        properties = {
            forceX = { type = "number", default = 0, description = "Force X component" },
            forceY = { type = "number", default = 0, description = "Force Y component" },
            forceZ = { type = "number", default = 0, description = "Force Z component" },
            impulse = { type = "boolean", default = false, description = "Apply as impulse (instant) or force" },
            applyAtFrame = { type = "number", default = 1, description = "Frame to apply the force" }
        }
    },

    init = function(self)
        ---@type ApplyForceState
        self.state = {
            frameCount = 0,
            applied = false
        }
    end,

    ---Apply force on the configured frame
    ---@param self ScriptInstance<ApplyForceProps, ApplyForceState>
    ---@param dt number Delta time in milliseconds
    update = function(self, dt)
        self.state.frameCount = self.state.frameCount + 1
        
        if self.state.frameCount == self.properties.applyAtFrame and not self.state.applied then
            ---@type Vec3
            local force = {
                x = self.properties.forceX,
                y = self.properties.forceY,
                z = self.properties.forceZ
            }
            
            if self.properties.impulse then
                physics.applyImpulse(self.id, force)
                log:info("Script", "Applied impulse: " .. tostring(force.x) .. ", " .. tostring(force.y) .. ", " .. tostring(force.z))
            else
                physics.applyForce(self.id, force)
                log:info("Script", "Applied force: " .. tostring(force.x) .. ", " .. tostring(force.y) .. ", " .. tostring(force.z))
            end
            
            self.state.applied = true
        end
    end
}
