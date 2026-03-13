// Auto-generated file. Do not edit directly.
// Run 'npm run build:test-scripts' to regenerate.

export const PhysicsTestScripts: Record<string, string> = {
    "test://apply_force.lua": `---@meta
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
`,
    "test://collision_logger.lua": `---@meta
-- =======================================================================
-- collision_logger.lua
-- Test script that logs collision events for validation in tests
-- =======================================================================

---@class CollisionLoggerProps

---@class CollisionLoggerState
---@field collisionCount number Number of collision events received
---@field lastCollider string|nil Entity ID of the last colliding entity
---@field lastKind string|nil Type of the last collision event ('enter', 'stay', 'exit')

---@class CollisionLoggerScript : DuckEntity<CollisionLoggerProps, CollisionLoggerState>

---@type ScriptModule<CollisionLoggerScript>
return {
    schema = {
        name = "Collision Logger",
        description = "Logs collision events for testing purposes",
        properties = {}
    },

    init = function(self)
        ---@type CollisionLoggerState
        self.state = {
            collisionCount = 0,
            lastCollider = nil,
            lastKind = nil
        }
    end,

    ---Handle collision enter event
    ---@param self ScriptInstance<CollisionLoggerProps, CollisionLoggerState>
    ---@param other string Entity ID of the colliding entity
    onCollisionEnter = function(self, other)
        self.state.collisionCount = self.state.collisionCount + 1
        self.state.lastCollider = other
        self.state.lastKind = "enter"
        
        -- Log for test visibility
        log:info("Script", "Collision (enter) with: " .. tostring(other))
    end,

    ---Handle collision exit event
    ---@param self ScriptInstance<CollisionLoggerProps, CollisionLoggerState>
    ---@param other string Entity ID of the previously colliding entity
    onCollisionExit = function(self, other)
        self.state.lastKind = "exit"
        
        -- Log for test visibility
        log:info("Script", "Collision (exit) with: " .. tostring(other))
    end
}
`,
    "test://distance_trigger.lua": `---@meta
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
`,
    "test://raycast_detector.lua": `---@meta
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
`,
    "test://velocity_monitor.lua": `---@meta
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
`,
};
