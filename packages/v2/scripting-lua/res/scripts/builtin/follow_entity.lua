-- =======================================================================
-- follow_entity.lua (V2)
-- Kinematic follow with time-delayed position buffering.
-- The entity trails behind the target by a configurable delay.
-- =======================================================================

---@class FollowEntityPropsV2
---@field targetEntityId EntityWrapperV2 Target entity to follow (entityRef).
---@field delay number How far behind (seconds) to trail the target. Default: 0.5.
---@field speed number Smoothing speed for position interpolation. Default: 5.
---@field offset Vec3V2|table World-space offset from the target. Default: {0,5,5}.

---@class FollowEntityStateV2
---@field history table[] Ring buffer of { t = timestamp, pos = {x,y,z} }

---@class FollowEntityScript : ScriptInstanceV2
---@field properties FollowEntityPropsV2
---@field state FollowEntityStateV2
local FollowEntity = {
    schema = {
        name = "Follow Entity (Kinematic) (V2)",
        description = "Follows a target entity with smoothing and optional time delay.",
        properties = {
            targetEntityId = { type = "entityRef", default = "", description = "Target entity to follow." },
            delay          = { type = "number", default = 0.5, description = "How far behind (seconds) to trail the target." },
            speed          = { type = "number", default = 5, description = "Smoothing speed for position interpolation." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    }
}

function FollowEntity:init()
    self.state = {
        history = {}
    }
end

function FollowEntity:update(dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local props  = self.properties
    local delay  = props.delay
    local speed  = props.speed
    local offset = props.offset
    if not offset then return end

    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local now = Engine.Time.getElapsed()
    table.insert(self.state.history, {
        t = now,
        pos = { x = tpRaw.x, y = tpRaw.y, z = tpRaw.z }
    })

    while #self.state.history > 1 and (now - self.state.history[2].t) > delay do
        table.remove(self.state.history, 1)
    end

    local targetPos = { x = tpRaw.x, y = tpRaw.y, z = tpRaw.z }
    if delay > 0 and #self.state.history > 0 then
        targetPos = self.state.history[1].pos
    end

    local desiredX = targetPos.x + (offset.x or offset[1] or 0)
    local desiredY = targetPos.y + (offset.y or offset[2] or 0)
    local desiredZ = targetPos.z + (offset.z or offset[3] or 0)

    local cur = self.entity.components.transform.getPosition()
    local t = math.min(1, speed * dt)

    self.entity.components.transform.setPosition(
        math.ext.lerp(cur.x, desiredX, t),
        math.ext.lerp(cur.y, desiredY, t),
        math.ext.lerp(cur.z, desiredZ, t)
    )
end

return FollowEntity
