-- =======================================================================
-- move_to_point.lua (V2)
-- Moves the entity to a target point over a fixed duration using easing.
-- =======================================================================

---@class MoveToPointPropsV2
---@field targetPoint Vec3V2|table Destination world coordinate.
---@field duration? number Travel time in seconds. Default: 2.0.
---@field easing? string Easing curve name. Default: "cubicInOut".
---@field delay? number Delay in seconds before starting movement. Default: 0.

---@class MoveToPointStateV2
---@field startPos Vec3V2 Starting position before movement.
---@field elapsed number Elapsed time since movement start.
---@field active boolean Whether the movement is currently active.

---@class MoveToPointScript : ScriptInstanceV2
---@field properties MoveToPointPropsV2
---@field state MoveToPointStateV2
local MoveToPoint = {
    schema = {
        name = "Move to Point (V2)",
        description = "Interpolates position towards a target point.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "Destination point." },
            duration    = { type = "number", default = 2.0, description = "Duration in seconds." },
            easing      = { type = "string", default = "cubicInOut", description = "Easing name." },
            delay       = { type = "number", default = 0, description = "Initial delay." }
        }
    }
}

function MoveToPoint:init()
    local transform = self.entity.components.transform
    self.state = {
        startPos = transform.has() and transform.getLocalPosition() or nil,
        elapsed  = 0,
        active   = transform.has()
    }
end

--- Restart if target changes
--- @param _dt number (unused, 0 for property changes)
--- @param key string Property key that changed
--- @param value any New value
function MoveToPoint:onPropertyChanged(_dt, key, value)
    if key == "targetPoint" then
        local transform = self.entity.components.transform
        if not transform.has() then
            self.state.active = false
            return
        end
        self.state.startPos = transform.getLocalPosition()
        self.state.elapsed  = 0
        self.state.active   = true
    end
end

function MoveToPoint:update(dt)
    if not self.state.active then return end
    local transform = self.entity.components.transform
    if not transform.has() then
        self.state.active = false
        return
    end

    local props   = self.properties
    local target  = props.targetPoint
    if not target then return end
    local state   = self.state
    local start   = state.startPos
    if not start then return end
    local secs    = dt
    state.elapsed = state.elapsed + secs

    local delay   = props.delay or 0
    if state.elapsed < delay then return end

    local t = (state.elapsed - delay) / math.max(0.001, props.duration)
    if t >= 1 then
        t = 1
        state.active = false
    end

    local easedFn = math.ext.easing[props.easing] or math.ext.easing.linear
    local easedT  = easedFn(t)

    local nx      = math.ext.lerp(start.x, target.x, easedT)
    local ny      = math.ext.lerp(start.y, target.y, easedT)
    local nz      = math.ext.lerp(start.z, target.z, easedT)
    transform.setPosition(math.vec3.new(nx, ny, nz))
end

return MoveToPoint
