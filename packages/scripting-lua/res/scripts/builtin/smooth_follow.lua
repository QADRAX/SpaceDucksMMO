-- =======================================================================
-- smooth_follow.lua (V2)
-- Eased follow with configurable curve and arrival behavior.
-- =======================================================================

---@class SmoothFollowPropsV2
---@field targetEntityId EntityWrapperV2 Target entity to follow (entityRef).
---@field duration number Time in seconds to reach the target. Default: 1.0.
---@field easing string Easing function: linear, quadOut, cubicInOut, etc. Default: "quadOut".
---@field offset Vec3V2|table World-space offset from target. Default: {0,5,5}.

---@class SmoothFollowStateV2
---@field startPos Vec3V2|table|nil
---@field elapsed number
---@field lastGoal Vec3V2|table|nil

---@class SmoothFollowScript : ScriptInstanceV2
---@field properties SmoothFollowPropsV2
---@field state SmoothFollowStateV2
local SmoothFollow = {
    schema = {
        name = "Smooth Follow (Eased) (V2)",
        description = "Follows a target using configurable easing curves for cinematic motion.",
        properties = {
            targetEntityId = { type = "entityRef", default = "", description = "Target entity to follow." },
            duration       = { type = "number", default = 1.0, description = "Time in seconds to reach the target." },
            easing         = { type = "string", default = "quadOut", description = "Easing function." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from target." }
        }
    }
}

function SmoothFollow:init()
    self.state = {
        startPos = nil,
        elapsed  = 0,
        lastGoal = nil
    }
end

function SmoothFollow:update(dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local props    = self.properties
    local duration = math.max(0.01, props.duration)
    local offset   = props.offset
    if not offset then return end

    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local ox = offset.x or offset[1] or 0
    local oy = offset.y or offset[2] or 0
    local oz = offset.z or offset[3] or 0
    local goal = {
        x = tpRaw.x + ox,
        y = tpRaw.y + oy,
        z = tpRaw.z + oz
    }

    local last = self.state.lastGoal
    if not last or not self.state.startPos then
        self.state.startPos = self.entity.components.transform.getPosition()
        self.state.elapsed  = 0
        self.state.lastGoal = goal
    else
        local dist = math.sqrt(
            (goal.x - last.x) ^ 2 + (goal.y - last.y) ^ 2 + (goal.z - last.z) ^ 2
        )
        if dist > 0.01 then
            self.state.startPos = self.entity.components.transform.getPosition()
            self.state.elapsed  = 0
            self.state.lastGoal = goal
        end
    end

    self.state.elapsed = self.state.elapsed + dt

    local raw = math.ext.clamp(self.state.elapsed / duration, 0, 1)
    local t   = math.ext.ease(props.easing or "quadOut", raw)

    local sp = self.state.startPos
    if not sp then return end

    self.entity.components.transform.setPosition(
        math.ext.lerp(sp.x, goal.x, t),
        math.ext.lerp(sp.y, goal.y, t),
        math.ext.lerp(sp.z, goal.z, t)
    )
end

return SmoothFollow
