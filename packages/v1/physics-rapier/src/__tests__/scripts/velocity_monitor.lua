---@meta
-- =======================================================================
-- velocity_monitor.lua
-- Test script that monitors and modifies entity velocity
-- =======================================================================

---@class VelocityMonitorProps
---@field maxVelocity number Maximum allowed velocity magnitude
---@field damping number Velocity damping factor (0-1)

---@class VelocityMonitorState
---@field frameCount number Frame counter
---@field currentVelocity Vec3 Last recorded velocity
---@field velocityExceeded boolean Whether velocity exceeded max
---@field timesLimited number How many times velocity was limited

---@class VelocityMonitorScript : DuckEntity<VelocityMonitorProps, VelocityMonitorState>

---@type ScriptModule<VelocityMonitorScript>
return {
    schema = {
        name = "Velocity Monitor",
        description = "Monitors and limits entity velocity",
        properties = {
            maxVelocity = { type = "number", default = 20, description = "Max velocity magnitude" },
            damping = { type = "number", default = 0.95, description = "Velocity damping factor" }
        }
    },

    init = function(self)
        ---@type VelocityMonitorState
        self.state = {
            frameCount = 0,
            currentVelocity = {x = 0, y = 0, z = 0},
            velocityExceeded = false,
            timesLimited = 0
        }
    end,

    ---Monitor velocity and apply damping
    ---@param self ScriptInstance<VelocityMonitorProps, VelocityMonitorState>
    ---@param dt number Delta time in milliseconds
    update = function(self, dt)
        -- Get current velocity
        local vel = self:getLinearVelocity()
        self.state.currentVelocity = vel

        -- Calculate velocity magnitude
        local magnitude = math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
        
        if magnitude > self.properties.maxVelocity then
            self.state.velocityExceeded = true
            self.state.timesLimited = self.state.timesLimited + 1
            
            -- Apply damping to velocity
            local scale = self.properties.damping
            local damped = {
                x = vel.x * scale,
                y = vel.y * scale,
                z = vel.z * scale
            }
            
            log:info("Script", "Velocity limited from " .. tostring(magnitude) .. " to " .. tostring(magnitude * scale))
        else
            self.state.velocityExceeded = false
        end
    end
}
