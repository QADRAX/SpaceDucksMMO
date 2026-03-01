-- =======================================================================
-- waypoint_path.lua
-- Moves the entity through a list of waypoint entities.
-- Each waypoint is a scene entity whose transform.position is read at
-- runtime, so waypoints can be moved while the path is being followed.
-- =======================================================================

---@class WaypointPathState
---@field index    number   Current waypoint index (1-based).
---@field t        number   Interpolation progress [0, 1] between current and next.

---@type ScriptBlueprint<WaypointPathProps, WaypointPathState>
return {
    schema = {
        name = "Waypoint Path",
        description = "Follows a sequence of waypoint entities.",
        properties = {
            speed     = { type = "number",      default = 3,    description = "Movement speed in units/sec." },
            loop      = { type = "boolean",     default = true, description = "Loop back to start when the end is reached." },
            waypoints = { type = "entityArray", default = {},   description = "Ordered list of waypoint entities." }
        }
    },

    ---@param self ScriptInstance<WaypointPathProps, WaypointPathState>
    init = function(self)
        self.state.index = 1
        self.state.t     = 0
    end,

    ---@param self ScriptInstance<WaypointPathProps, WaypointPathState>
    ---@param dt number
    update = function(self, dt)
        local state = self.state
        local wps   = self.properties.waypoints
        if not wps then return end

        local count = #wps
        if count < 2 then return end

        local idx     = state.index
        local nextIdx = idx % count + 1

        local wpFrom = wps[idx]
        local wpTo   = wps[nextIdx]
        if not wpFrom or not wpTo then return end
        if not wpFrom:isValid() or not wpTo:isValid() then return end

        local from = wpFrom:getPosition()
        local to   = wpTo:getPosition()

        local segLen = from:distanceTo(to)
        if segLen < 1e-6 then
            state.index = nextIdx
            state.t     = 0
            return
        end

        local step = (self.properties.speed * dt) / segLen
        state.t    = state.t + step

        if state.t >= 1 then
            state.t     = 0
            state.index = nextIdx
            -- Stop at the end when not looping
            if not self.properties.loop and nextIdx == count then
                self:setPosition(to)
                return
            end
            -- Advance to next segment
            idx     = state.index
            nextIdx = idx % count + 1
            wpFrom  = wps[idx]
            wpTo    = wps[nextIdx]
            if not wpFrom or not wpTo then return end
            from = wpFrom:getPosition()
            to   = wpTo:getPosition()
        end

        local pos = from:lerp(to, state.t)
        self:setPosition(pos)
    end
}
