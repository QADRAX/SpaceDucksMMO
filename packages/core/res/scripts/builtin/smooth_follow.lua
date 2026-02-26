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

---@type ScriptModule
return {
    schema = {
        name = "Smooth Follow (Eased)",
        description = "Follows a target using configurable easing curves for cinematic motion.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to follow." },
            duration       = { type = "number", default = 1.0, description = "Time in seconds to reach the target." },
            easing         = { type = "string", default = "quadOut", description = "Easing function: linear, quadOut, cubicInOut, bounceOut, smoothstep, etc." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from target." }
        }
    },

    init = function(self)
        self.state.startPos = nil -- captured when target moves
        self.state.elapsed  = 0
        self.state.lastGoal = nil
    end,

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target   = self.targetEntityId

        local props    = self.properties or {}
        local duration = math.max(0.01, props.duration or 1.0)
        local ease     = getEasing(props.easing or "quadOut")
        local offset   = props.offset or { 0, 0, 0 }

        -- Calculate goal position (target + offset)
        local tp       = target:getPosition()
        local goal     = {
            x = tp.x + offset[1],
            y = tp.y + offset[2],
            z = tp.z + offset[3]
        }

        -- Detect if goal changed significantly → restart easing
        local last     = self.state.lastGoal
        if not last or not self.state.startPos then
            self.state.startPos = self:getPosition()
            self.state.elapsed  = 0
            self.state.lastGoal = goal
        else
            local dx = goal.x - last.x
            local dy = goal.y - last.y
            local dz = goal.z - last.z
            local dist = math.sqrt(dx * dx + dy * dy + dz * dz)
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
        self:setPosition(
            math.ext.lerp(sp.x, goal.x, t),
            math.ext.lerp(sp.y, goal.y, t),
            math.ext.lerp(sp.z, goal.z, t)
        )
    end
}
