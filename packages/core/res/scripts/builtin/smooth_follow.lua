-- =======================================================================
-- smooth_follow.lua
-- Eased follow with configurable curve and arrival behavior.
-- Uses easing functions for smooth acceleration/deceleration as the
-- entity approaches or leaves its target. Great for cinematic cameras.
-- =======================================================================

---Selects an easing function by name, falling back to smoothstep.
---@param name string
---@return fun(t: number): number
local function getEasing(name)
    local fn = math.ext.easing[name]
    if fn then return fn end
    return math.ext.easing.smoothstep
end

---@class SmoothFollowState
---@field startPos       Vec3?
---@field elapsed        number
---@field lastGoal       Vec3?

---@type ScriptBlueprint<SmoothFollowProps, SmoothFollowState>
return {
    schema = {
        name = "Smooth Follow (Eased)",
        description = "Follows a target using configurable easing curves for cinematic motion.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to follow." },
            duration       = { type = "number", default = 1.0, description = "Time in seconds to reach the target." },
            easing         = { type = "string", default = "quadOut", description = "Easing function: linear, quadOut, cubicInOut, bounceOut, smoothstep, etc." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from target." }
        }
    },

    ---@param self ScriptInstance<SmoothFollowProps, SmoothFollowState>
    init = function(self)
        self.state.startPos = nil -- captured when target moves
        self.state.elapsed  = 0
        self.state.lastGoal = nil
    end,


    ---@param self ScriptInstance<SmoothFollowProps, SmoothFollowState>
    ---@param dt number
    update = function(self, dt)
        local props    = self.properties
        local target   = props.targetEntityId
        local duration = math.max(0.01, props.duration)
        local ease     = getEasing(props.easing)
        local offset   = props.offset



        -- Calculate goal position (target + offset)
        local tp = target:getPosition()
        if not tp then return end
        local offsetVec = math.vec3(offset[1], offset[2], offset[3])
        local goal      = tp + offsetVec

        -- Detect if goal changed significantly → restart easing
        local last      = self.state.lastGoal
        if not last or not self.state.startPos then
            self.state.startPos = self:getPosition()
            self.state.elapsed  = 0
            self.state.lastGoal = goal
        else
            local dist = goal:distanceTo(last)
            if dist > 0.01 then
                -- Target moved — restart easing from current pos
                self.state.startPos = self:getPosition()
                self.state.elapsed  = 0
                self.state.lastGoal = goal
            end
        end

        -- Advance the easing timer
        local secs         = dt / 1000
        self.state.elapsed = self.state.elapsed + secs

        -- Calculate normalized time (0..1) and apply easing curve
        local raw          = math.ext.clamp(self.state.elapsed / duration, 0, 1)
        local t            = ease(raw)

        -- Interpolate from start position to goal using the eased `t`
        local sp           = self.state.startPos
        if not sp then return end
        self:setPosition(math.vec3(
            math.ext.lerp(sp.x, goal.x, t),
            math.ext.lerp(sp.y, goal.y, t),
            math.ext.lerp(sp.z, goal.z, t)
        ))
    end
}
