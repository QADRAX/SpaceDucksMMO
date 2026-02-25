---@type ScriptModule
return {
    schema = {
        name = "Look at Entity",
        description =
        "Continuously rotates the entity to face another target entity in the scene, optionally interpolating position if following is configured.",
        properties = {
            targetEntityId = { type = "entity", default = "", description = "The ID of the target entity to look at." },
            followSpeed = { type = "number", default = 0, description = "If > 0, the entity will smoothly lerp towards the target plus the offset." },
            offset = { type = "vec3", default = { 0, 0, 0 }, description = "The positional offset [x, y, z] to maintain relative to the target when following." },
            lookAtOffset = { type = "vec3", default = { 0, 0, 0 }, description = "The offset [x, y, z] applied to the target's position when looking at it (e.g., looking at their head instead of their feet)." }
        }
    },

    init = function(self)
        local props = self.properties or {}
        self.state.target = scene.getEntity(props.targetEntityId)
    end,

    onPropertyChanged = function(self, key, value)
        if key == "targetEntityId" then
            self.state.target = scene.getEntity(value)
        end
    end,

    update = function(self, dt)
        local target = self.state.target
        if not target then return end

        local props = self.properties or {}
        local followSpeed = props.followSpeed or 0
        local offset = props.offset or { 0, 0, 0 }
        local lookAtOffset = props.lookAtOffset or { 0, 0, 0 }

        local tp = target:getPosition()
        if not tp then return end

        local targetPoint = {
            x = tp.x + lookAtOffset[1],
            y = tp.y + lookAtOffset[2],
            z = tp.z + lookAtOffset[3]
        }

        -- Rotational logic
        self:lookAt(targetPoint.x, targetPoint.y, targetPoint.z)

        -- Positional following logic
        if followSpeed > 0 then
            local desired = {
                x = tp.x + offset[1],
                y = tp.y + offset[2],
                z = tp.z + offset[3]
            }
            local cur = self:getPosition()
            if not cur then return end

            local secs = dt / 1000
            local t = math.min(1, followSpeed * secs)

            self:setPosition(
                cur.x + (desired.x - cur.x) * t,
                cur.y + (desired.y - cur.y) * t,
                cur.z + (desired.z - cur.z) * t
            )
        end
    end
}
