---@meta
-- =======================================================================
-- distance_trigger.lua
-- Test script that applies forces based on distance to target
-- =======================================================================

---@class DistanceTriggerProps
---@field targetEntity DuckEntity Target entity to measure distance to
---@field triggerDistance number Distance threshold to trigger force
---@field forceStrength number Magnitude of force to apply

---@class DistanceTriggerState
---@field frameCount number Frame counter
---@field distanceToTarget number|nil Current distance to target
---@field isTriggered boolean Whether force is currently being applied
---@field timesTriggered number How many times distance threshold crossed

---@class DistanceTriggerScript : DuckEntity<DistanceTriggerProps, DistanceTriggerState>

---@type ScriptModule<DistanceTriggerScript>
return {
    schema = {
        name = "Distance Trigger",
        description = "Applies force when object enters trigger distance",
        properties = {
            targetEntity = { type = "entity", required = true, description = "Target to measure distance to" },
            triggerDistance = { type = "number", default = 5, description = "Distance threshold" },
            forceStrength = { type = "number", default = 10, description = "Applied force magnitude" }
        }
    },

    init = function(self)
        ---@type DistanceTriggerState
        self.state = {
            frameCount = 0,
            distanceToTarget = nil,
            isTriggered = false,
            timesTriggered = 0
        }
    end,

    ---Check distance and apply force
    ---@param self ScriptInstance<DistanceTriggerProps, DistanceTriggerState>
    ---@param dt number Delta time in milliseconds
    update = function(self, dt)
        if not self.properties.targetEntity or not self.properties.targetEntity:isValid() then
            return
        end
        
        -- Calculate distance to target
        local myPos = self:getPosition()
        local targetPos = self.properties.targetEntity:getPosition()
        
        local dx = targetPos.x - myPos.x
        local dy = targetPos.y - myPos.y
        local dz = targetPos.z - myPos.z
        
        local distance = math.sqrt(dx * dx + dy * dy + dz * dz)
        self.state.distanceToTarget = distance
        
        -- Check if within trigger distance
        if distance <= self.properties.triggerDistance then
            if not self.state.isTriggered then
                self.state.isTriggered = true
                self.state.timesTriggered = self.state.timesTriggered + 1
                
                -- Normalize direction and apply force
                local magnitude = math.sqrt(dx * dx + dy * dy + dz * dz)
                if magnitude > 0 then
                    local force = {
                        x = (dx / magnitude) * self.properties.forceStrength,
                        y = (dy / magnitude) * self.properties.forceStrength,
                        z = (dz / magnitude) * self.properties.forceStrength
                    }
                    self:applyForce(force)
                    log:info("Script", "Applied trigger force, distance: " .. tostring(distance))
                end
            end
        else
            self.state.isTriggered = false
        end
    end
}
