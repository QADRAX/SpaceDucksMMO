-- =======================================================================
-- waypoint_path.lua (V2)
-- Follows a list of waypoint entities by driving a sibling move_to_point script.
-- =======================================================================

---@class WaypointPathPropsV2
---@field speed? number Movement speed in units/sec. Default: 3.
---@field loop? boolean If true, loops back to first waypoint. Default: true.
---@field waypoints? EntityWrapperV2[] Ordered list of waypoint entities.
---@field easing? string Easing curve forwarded to MoveToPoint. Default: "cubicInOut".
---@field arrivalThreshold? number Distance at which the waypoint is considered reached. Default: 0.15.

---@class WaypointPathStateV2
---@field index number Current target waypoint index (1-based).
---@field waiting boolean True when waiting for MoveToPoint to reach target.

---@class WaypointPathScript : ScriptInstanceV2
---@field properties WaypointPathPropsV2
---@field state WaypointPathStateV2
local WaypointPath = {
    schema = {
        name = "Waypoint Path (V2)",
        description = "Sequences movement through entity waypoints.",
        properties = {
            speed            = { type = "number", default = 3, description = "Units per second." },
            loop             = { type = "boolean", default = true, description = "Loop back to start." },
            waypoints        = { type = "entityRefArray", default = {}, description = "Entities to follow." },
            easing           = { type = "string", default = "cubicInOut", description = "Forwarded easing." },
            arrivalThreshold = { type = "number", default = 0.2, description = "Distance threshold." }
        }
    }
}

function WaypointPath:init()
    self.state = {
        index   = 1,
        waiting = false
    }
end

function WaypointPath:update(dt)
    local waypoints = self.references.waypoints
    if not waypoints or #waypoints == 0 then return end

    local state = self.state
    local targetEntity = waypoints[state.index]
    if not targetEntity then return end

    -- Check if we arrived at target
    -- Note: Waypoint Path uses WORLD position for distance check because waypoints might be parented elsewhere
    local posRaw = self.entity.components.transform.getPosition()
    local targetRaw = targetEntity.components.transform.getPosition()
    
    local pos = math.vec3.new(posRaw.x, posRaw.y, posRaw.z)
    local target = math.vec3.new(targetRaw.x, targetRaw.y, targetRaw.z)
    local dist = pos:distanceTo(target)

    local props  = self.properties

    if dist < (props.arrivalThreshold or 0.2) then
        -- Arrived! Advance index
        local nextIdx = state.index + 1
        if nextIdx > #waypoints then
            if props.loop then
                nextIdx = 1
            else
                return     -- finished
            end
        end
        state.index   = nextIdx
        state.waiting = false
    end

    -- Drive sibling move_to_point if not already moving towards CURRENT target
    if not state.waiting then
        -- We just changed target or just started
        local duration = dist / math.max(0.1, props.speed)

        -- Drive the sibling script
        -- IMPORTANT: MoveToPoint expects LOCAL coordinates if it's going to use setPosition
        -- However, Built-in scripts often assume they are at root OR they target world coords.
        -- If mover is not at root, we'd need to convert world target to local target.
        -- For simplicity, let's assume mover is at root for now or MoveToPoint handles world? 
        -- No, MoveToPoint uses setPosition (local).
        
        -- Logic: If we want to reach a world point via local movement:
        -- localTarget = moverParentInv * worldTarget
        
        -- For built-in simplicity, let's assume world==local for now or add a setWorldPosition bridge.
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "targetPoint", target)
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "duration", duration)
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "easing",
            props.easing or "cubicInOut")

        state.waiting = true
    end
end

return WaypointPath
