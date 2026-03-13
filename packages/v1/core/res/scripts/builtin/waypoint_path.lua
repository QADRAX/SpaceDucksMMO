-- =======================================================================
-- waypoint_path.lua
-- Orchestrates movement through a list of waypoint entities by driving
-- a sibling move_to_point script.  Each waypoint is a scene entity
-- whose transform.position is read at runtime, so waypoints can be
-- moved while the path is being followed.
--
-- REQUIRES: a "Move to Point (Eased)" script slot on the same entity.
-- waypoint_path sets targetPoint / duration / easing / delay on it.
-- =======================================================================

---@class WaypointPathState
---@field index       number   Index of the waypoint we are currently moving TOWARDS (1-based).
---@field moving      boolean  True after we have pushed a target to move_to_point.
---@field segTime     number   Expected duration (seconds) for the current segment.
---@field elapsed     number   Seconds elapsed since we pushed the current target.

---@type ScriptBlueprint<WaypointPathProps, WaypointPathState>
return {
    schema = {
        name = "Waypoint Path",
        description = "Follows a sequence of waypoint entities by driving a sibling Move-to-Point script.",
        properties = {
            speed            = { type = "number",      default = 3,           description = "Movement speed in units/sec." },
            loop             = { type = "boolean",     default = true,        description = "Loop back to start when the end is reached." },
            waypoints        = { type = "entityArray", default = {},          description = "Ordered list of waypoint entities." },
            easing           = { type = "string",      default = "cubicInOut", description = "Easing curve forwarded to Move-to-Point." },
            arrivalThreshold = { type = "number",      default = 0.15,        description = "Distance at which the waypoint is considered reached." }
        }
    },

    ---@param self ScriptInstance<WaypointPathProps, WaypointPathState>
    init = function(self)
        self.state.index   = 1
        self.state.moving  = false
        self.state.segTime = 0
        self.state.elapsed = 0
    end,

    ---@param self ScriptInstance<WaypointPathProps, WaypointPathState>
    ---@param dt number
    update = function(self, dt)
        local wps   = self.properties.waypoints
        if not wps then return end

        local count = #wps
        if count < 1 then return end

        -- Access sibling move_to_point script via cross-script proxy
        local mtp = self.scripts[Script.MoveToPoint]
        if not mtp then return end

        local secs = dt / 1000

        -- ── Skip waypoints we are already on top of ─────────────────
        -- This handles the common case where the entity starts at
        -- the first waypoint and needs to immediately target the next.
        while not self.state.moving do
            local idx = self.state.index
            local wp  = wps[idx]
            if not wp or not wp:isValid() then return end

            local target = wp:getPosition()
            local dist   = self:getPosition():distanceTo(target)

            if dist < (self.properties.arrivalThreshold or 0.15) then
                -- Already at this waypoint — advance
                local nextIdx = idx + 1
                if nextIdx > count then
                    if self.properties.loop then
                        nextIdx = 1
                    else
                        return -- path complete
                    end
                end
                self.state.index = nextIdx
            else
                -- Push target to move_to_point
                local duration = dist / math.max(0.01, self.properties.speed)

                mtp.targetPoint = target:toArray()
                mtp.duration    = duration
                mtp.easing      = self.properties.easing or "cubicInOut"
                mtp.delay       = 0

                self.state.moving  = true
                self.state.segTime = duration
                self.state.elapsed = 0
                return  -- Wait for move_to_point to pick up the new target
            end
        end

        -- ── Check arrival ────────────────────────────────────────────
        self.state.elapsed = self.state.elapsed + secs

        local idx    = self.state.index
        local wp     = wps[idx]
        if not wp or not wp:isValid() then return end

        local target = wp:getPosition()
        local dist   = self:getPosition():distanceTo(target)

        if dist < (self.properties.arrivalThreshold or 0.15) then
            -- Advance to next waypoint
            local nextIdx = idx + 1
            if nextIdx > count then
                if self.properties.loop then
                    nextIdx = 1
                else
                    return -- path complete
                end
            end
            self.state.index  = nextIdx
            self.state.moving = false
        end
    end
}
