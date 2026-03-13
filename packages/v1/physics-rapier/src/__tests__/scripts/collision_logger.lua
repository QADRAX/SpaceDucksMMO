---@meta
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
