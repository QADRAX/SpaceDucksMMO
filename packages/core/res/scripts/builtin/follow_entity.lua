-- =======================================================================
-- follow_entity.lua
-- Kinematic follow with time-delayed position buffering.
-- The entity trails behind the target by a configurable delay, creating
-- a smooth "camera lag" effect commonly used for chase cameras.
-- =======================================================================

---@class FollowEntityState
---@field history        table[]

---@type ScriptBlueprint<FollowEntityProps, FollowEntityState>
return {
    schema = {
        name = "Follow Entity (Kinematic)",
        description = "Follows a target entity with smoothing and optional time delay.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to follow." },
            delay          = { type = "number", default = 0.5, description = "How far behind (seconds) to trail the target." },
            speed          = { type = "number", default = 5, description = "Smoothing speed for position interpolation." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    },

    ---@param self ScriptInstance<FollowEntityProps, FollowEntityState>
    init = function(self)
        -- History ring buffer of { t = timestamp, x, y, z }
        self.state.history = {}
    end,

    ---@param self ScriptInstance<FollowEntityProps, FollowEntityState>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local target = props.targetEntityId
        local delay  = props.delay
        local speed  = props.speed
        local offset = props.offset



        -- 1. Record current target position with timestamp
        local tp  = target:getPosition()
        local now = time.now()
        if not tp then return end
        table.insert(self.state.history, { t = now, pos = tp:clone() })

        -- 2. Evict stale entries (keep only entries within the delay window)
        while #self.state.history > 1 and (now - self.state.history[2].t) > delay do
            table.remove(self.state.history, 1)
        end

        -- 3. Pick the oldest buffered position (= delayed target)
        local targetPos = tp
        if delay > 0 and #self.state.history > 0 then
            targetPos = self.state.history[1].pos
        end

        -- 4. Smoothly interpolate towards delayed target + offset
        local offsetVec = math.vec3(offset[1], offset[2], offset[3])
        local desired   = targetPos + offsetVec

        local cur       = self:getPosition()
        local t         = math.min(1, speed * (dt / 1000))

        self:setPosition(math.vec3(
            math.ext.lerp(cur.x, desired.x, t),
            math.ext.lerp(cur.y, desired.y, t),
            math.ext.lerp(cur.z, desired.z, t)
        ))
    end
}
