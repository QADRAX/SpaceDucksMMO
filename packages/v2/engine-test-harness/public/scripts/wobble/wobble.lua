-- =======================================================================
-- wobble.lua (custom script resource)
-- Slowly tilts the entity on one or two axes toward random targets.
-- Use on a container (e.g. arena) to keep balls subtly moving.
-- =======================================================================

---@class WobblePropsV2
---@field axis string Axis to tilt: 'x', 'z', or 'both'. Default: "both".
---@field maxAngle number Max tilt in degrees. Default: 4.
---@field changeInterval number Seconds between new random targets. Default: 4.
---@field smoothSpeed number Tilt speed in degrees/sec. Default: 1.5.

---@class WobbleStateV2
---@field targetX number Target X rotation (radians).
---@field targetZ number Target Z rotation (radians).
---@field timer number Time until next target change.

---@class WobbleScript : ScriptInstanceV2
---@field properties WobblePropsV2
---@field state WobbleStateV2
local Wobble = {
    schema = {
        name = "Wobble (V2)",
        description = "Slowly tilts the entity toward random angles. Keeps physics objects subtly moving.",
        properties = {
            axis           = { type = "string",  default = "both", description = "Axis: 'x', 'z', or 'both'." },
            maxAngle       = { type = "number",  default = 4,      description = "Max tilt in degrees." },
            changeInterval = { type = "number",  default = 4,      description = "Seconds between new targets." },
            smoothSpeed    = { type = "number",  default = 1.5,    description = "Tilt speed (degrees/sec)." }
        }
    }
}

local function toRad(deg)
    return deg * (math.pi / 180)
end

local function pickRandomTarget(maxDeg)
    return (math.random() * 2 - 1) * maxDeg
end

function Wobble:init()
    math.randomseed(os and os.time and os.time() or 12345)
    local maxRad = toRad(self.properties.maxAngle)
    self.state = {
        targetX = pickRandomTarget(self.properties.maxAngle),
        targetZ = pickRandomTarget(self.properties.maxAngle),
        timer   = self.properties.changeInterval
    }
    -- Convert to radians for storage
    self.state.targetX = toRad(self.state.targetX)
    self.state.targetZ = toRad(self.state.targetZ)
end

function Wobble:update(dt)
    local props = self.properties
    local state = self.state
    local axis  = props.axis or "both"
    local maxRad = toRad(props.maxAngle)
    local speedRad = toRad(props.smoothSpeed) * dt

    -- Pick new random targets when timer expires
    state.timer = state.timer - dt
    if state.timer <= 0 then
        state.timer = props.changeInterval
        if axis == "x" or axis == "both" then
            state.targetX = toRad(pickRandomTarget(props.maxAngle))
        end
        if axis == "z" or axis == "both" then
            state.targetZ = toRad(pickRandomTarget(props.maxAngle))
        end
    end

    local rot = self.entity.components.transform.getLocalRotation()
    if not rot then return end

    -- Lerp toward targets
    if axis == "x" or axis == "both" then
        local diff = state.targetX - rot.x
        if math.abs(diff) > 0.0001 then
            rot.x = rot.x + math.max(-speedRad, math.min(speedRad, diff))
        end
    end
    if axis == "z" or axis == "both" then
        local diff = state.targetZ - rot.z
        if math.abs(diff) > 0.0001 then
            rot.z = rot.z + math.max(-speedRad, math.min(speedRad, diff))
        end
    end

    self.entity.components.transform.setRotation(rot)
end

return Wobble
