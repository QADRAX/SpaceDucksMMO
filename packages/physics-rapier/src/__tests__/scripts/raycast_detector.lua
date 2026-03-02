---@meta
-- =======================================================================
-- raycast_detector.lua
-- Test script that uses raycasting to detect objects at distance
-- =======================================================================

---@class RaycastDetectorProps
---@field rayDirection Vec3 Direction to cast the ray (normalized)
---@field rayDistance number Maximum distance to raycast
---@field checkInterval number Frames between raycast checks

---@class RaycastDetectorState
---@field frameCount number Frame counter for interval checking
---@field lastHitEntity string|nil Last entity detected by raycast
---@field hitDistance number|nil Distance to last hit

---@class RaycastDetectorScript : DuckEntity<RaycastDetectorProps, RaycastDetectorState>

---@type ScriptModule<RaycastDetectorScript>
return {
    schema = {
        name = "Raycast Detector",
        description = "Detects objects using physics raycasting",
        properties = {
            rayDirection = { type = "vec3", default = {x = 1, y = 0, z = 0}, description = "Ray direction" },
            rayDistance = { type = "number", default = 50, description = "Max raycast distance" },
            checkInterval = { type = "number", default = 1, description = "Check every N frames" }
        }
    },

    init = function(self)
        ---@type RaycastDetectorState
        self.state = {
            frameCount = 0,
            lastHitEntity = nil,
            hitDistance = nil
        }
    end,

    ---Perform raycast and store results
    ---@param self ScriptInstance<RaycastDetectorProps, RaycastDetectorState>
    ---@param dt number Delta time in milliseconds
    update = function(self, dt)
        self.state.frameCount = self.state.frameCount + 1
        
        if self.state.frameCount >= self.properties.checkInterval then
            self.state.frameCount = 0
            
            ---@type Vec3
            local rayOrigin = self:getPosition()
            ---@type Vec3
            local rayDir = self.properties.rayDirection
            
            -- Perform raycast from entity position in specified direction
            local hit = physics.raycast(rayOrigin, rayDir, self.properties.rayDistance)
            
            if hit then
                self.state.lastHitEntity = hit.entityId
                self.state.hitDistance = hit.distance
                log:info("Script", "Raycast hit: " .. hit.entityId .. " at distance " .. tostring(hit.distance))
            else
                self.state.lastHitEntity = nil
                self.state.hitDistance = nil
            end
        end
    end
}
