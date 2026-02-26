-- =======================================================================
-- follow_entity.lua
-- Kinematic follow with time-delayed position buffering.
-- The entity trails behind the target by a configurable delay, creating
-- a smooth "camera lag" effect commonly used for chase cameras.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Follow Entity (Kinematic)",
        description = "Follows a target entity with smoothing and optional time delay.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to follow." },
            delay          = { type = "number", default = 0.5, description = "How far behind (seconds) to trail the target." },
            speed          = { type = "number", default = 5, description = "Smoothing speed for position interpolation." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    },

    init = function(self)
        -- History ring buffer of { t = timestamp, x, y, z }
        self.state.history = {}
    end,

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target = self.targetEntityId

        local props  = self.properties or {}
        local delay  = props.delay or 0
        local speed  = props.speed or 5
        local offset = props.offset or { 0, 0, 0 }

        -- 1. Record current target position with timestamp
        local tp     = target:getPosition()
        local now    = time.now()
        table.insert(self.state.history, { t = now, x = tp.x, y = tp.y, z = tp.z })

        -- 2. Evict stale entries (keep only entries within the delay window)
        while #self.state.history > 1 and (now - self.state.history[2].t) > delay do
            table.remove(self.state.history, 1)
        end

        -- 3. Pick the oldest buffered position (= delayed target)
        local targetPos = { x = tp.x, y = tp.y, z = tp.z }
        if delay > 0 and #self.state.history > 0 then
            targetPos = self.state.history[1]
        end

        -- 4. Smoothly interpolate towards delayed target + offset
        local desired = {
            x = targetPos.x + offset[1],
            y = targetPos.y + offset[2],
            z = targetPos.z + offset[3]
        }

        local cur     = self:getPosition()
        local t       = math.min(1, speed * (dt / 1000))

        self:setPosition(
            math.ext.lerp(cur.x, desired.x, t),
            math.ext.lerp(cur.y, desired.y, t),
            math.ext.lerp(cur.z, desired.z, t)
        )
    end
}
