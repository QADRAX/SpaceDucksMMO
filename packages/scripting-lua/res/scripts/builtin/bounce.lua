-- =======================================================================
-- bounce.lua (V2)
-- Sinusoidal hover/bounce on a single axis.
-- Uses Engine.Time.elapsed for smooth, consistent oscillation.
-- =======================================================================

---@class BouncePropsV2
---@field axis string Axis to bounce on: 'x', 'y', or 'z'. Default: "y".
---@field amplitude number Maximum displacement in world units. Default: 0.5.
---@field frequency number Oscillation frequency in Hz. Default: 1.

---@class BounceStateV2
---@field origin Vec3V2|table Starting position at init.

---@class BounceScript : ScriptInstanceV2
---@field properties BouncePropsV2
---@field state BounceStateV2
local Bounce = {
    schema = {
        name = "Bounce (V2)",
        description = "Oscillates the entity on a single axis using a sine wave.",
        properties = {
            axis      = { type = "string",  default = "y", description = "Axis to bounce on: 'x', 'y', or 'z'." },
            amplitude = { type = "number",  default = 0.5, description = "Maximum displacement in world units." },
            frequency = { type = "number",  default = 1,   description = "Oscillation frequency in Hz." }
        }
    }
}

function Bounce:init()
    local pos = self.entity.components.transform.getLocalPosition()
    self.state = {
        origin = pos
    }
end

function Bounce:update(_dt)
    local props  = self.properties
    local origin = self.state.origin
    if not origin then return end

    local t      = Engine.Time.getElapsed()
    local offset = math.sin(t * props.frequency * 2 * math.pi) * props.amplitude

    local pos = math.vec3.new(origin.x, origin.y, origin.z)
    local axis = props.axis
    if axis == "x" then
        pos.x = pos.x + offset
    elseif axis == "z" then
        pos.z = pos.z + offset
    else
        pos.y = pos.y + offset
    end
    self.entity.components.transform.setPosition(pos)
end

return Bounce
