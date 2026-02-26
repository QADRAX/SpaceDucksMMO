-- =======================================================================
-- orbit_camera.lua
-- Orbits the entity around a target entity on a configurable plane.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Orbit Camera",
        description = "Orbits this entity around a target at a fixed distance and speed.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId      = { type = "entity", default = "", description = "Central entity to orbit around." },
            altitudeFromSurface = { type = "number", default = 0, description = "Distance buffer from the target's center." },
            speed               = { type = "number", default = 0.5, description = "Orbit speed (radians per second)." },
            orbitPlane          = { type = "string", default = "xz", description = "Orbit plane: 'xz', 'xy', or 'yz'." },
            initialAngle        = { type = "number", default = 0, description = "Starting angle in radians." }
        }
    },

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target              = self.targetEntityId

        local props               = self.properties or {}
        local altitudeFromSurface = props.altitudeFromSurface or 0
        local speed               = props.speed or 0.5
        local orbitPlane          = props.orbitPlane or "xz"

        -- Initialize angle from property on first frame
        if not self.state.angle then
            self.state.angle = props.initialAngle or 0
        end

        local orbitDistance = 1 + altitudeFromSurface
        local secs          = dt / 1000
        self.state.angle    = self.state.angle + (speed * secs)

        local a             = self.state.angle
        local tp            = target:getPosition()
        if not tp then return end

        local offset = math.vec3.zero()

        -- Calculate orbital position on the chosen plane
        if orbitPlane == "xz" then
            offset.x = math.cos(a) * orbitDistance
            offset.z = math.sin(a) * orbitDistance
        elseif orbitPlane == "xy" then
            offset.x = math.cos(a) * orbitDistance
            offset.y = math.sin(a) * orbitDistance
        elseif orbitPlane == "yz" then
            offset.y = math.cos(a) * orbitDistance
            offset.z = math.sin(a) * orbitDistance
        end

        self:setPosition(tp + offset)
    end
}
