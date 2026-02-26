-- =======================================================================
-- move_to_point.lua
-- Moves the entity from its current position to a target point over
-- a configurable duration, using an easing curve. Once arrived, stops.
-- Can be restarted by changing the target point property.
-- Useful for cutscene waypoints, elevators, and animated platforms.
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
        name = "Move to Point (Eased)",
        description = "Moves the entity to a target point over time using an easing curve.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "Destination world coordinate." },
            duration    = { type = "number", default = 2.0, description = "Travel time in seconds." },
            easing      = { type = "string", default = "cubicInOut", description = "Easing curve: cubicInOut, bounceOut, sineInOut, etc." },
            delay       = { type = "number", default = 0, description = "Delay in seconds before starting movement." }
        }
    },

    init = function(self)
        self.state.startPos = self:getPosition()
        self.state.elapsed  = 0
        self.state.started  = false
    end,

    ---Restart the animation when the target point changes.
    onPropertyChanged = function(self, key, value)
        if key == "targetPoint" then
            self.state.startPos = self:getPosition()
            self.state.elapsed  = 0
            self.state.started  = false
        end
    end,

    update = function(self, dt)
        local props  = self.properties or {}
        local target = props.targetPoint
        if not target then return end

        local duration     = math.max(0.01, props.duration or 2.0)
        local delay        = math.max(0, props.delay or 0)
        local ease         = getEasing(props.easing or "cubicInOut")

        local secs         = dt / 1000
        self.state.elapsed = self.state.elapsed + secs

        -- Wait through the delay period
        if self.state.elapsed < delay then return end

        -- Calculate progress within the active movement window
        local active = self.state.elapsed - delay
        local raw    = math.ext.clamp(active / duration, 0, 1)
        local t      = ease(raw)

        -- Interpolate from starting position to target
        local sp     = self.state.startPos
        local tp     = math.vec3(target[1], target[2], target[3])
        self:setPosition(math.vec3(
            math.ext.lerp(sp.x, tp.x, t),
            math.ext.lerp(sp.y, tp.y, t),
            math.ext.lerp(sp.z, tp.z, t)
        ))
    end
}
