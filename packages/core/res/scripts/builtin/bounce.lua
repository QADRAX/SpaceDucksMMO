-- =======================================================================
-- bounce.lua
-- Sinusoidal hover/bounce on a single axis.
-- Uses time.getElapsed() for smooth, consistent oscillation.
-- =======================================================================

---@class BounceState
---@field origin Vec3?

---@type ScriptBlueprint<BounceProps, BounceState>
return {
    schema = {
        name = "Bounce",
        description = "Oscillates the entity on a single axis using a sine wave.",
        properties = {
            axis      = { type = "string",  default = "y", description = "Axis to bounce on: 'x', 'y', or 'z'." },
            amplitude = { type = "number",  default = 0.5, description = "Maximum displacement in world units." },
            frequency = { type = "number",  default = 1,   description = "Oscillation frequency in Hz." }
        }
    },

    ---@param self ScriptInstance<BounceProps, BounceState>
    init = function(self)
        self.state.origin = self:getPosition():clone()
    end,

    ---@param self ScriptInstance<BounceProps, BounceState>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local origin = self.state.origin
        if not origin then return end

        local t      = time.getElapsed() / 1000   -- elapsed is in ms; convert to seconds
        local offset = math.sin(t * props.frequency * 2 * math.pi) * props.amplitude

        local pos = origin:clone()
        local axis = props.axis
        if axis == "x" then
            pos.x = pos.x + offset
        elseif axis == "z" then
            pos.z = pos.z + offset
        else
            pos.y = pos.y + offset
        end
        self:setPosition(pos)
    end
}
