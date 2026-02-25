---@type ScriptModule
return {
    schema = {
        name = "Orbit Camera",
        description = "Rotates the entity in a continuous circular orbit around a target entity.",
        properties = {
            targetEntityId = { type = "entity", default = "", description = "The ID of the central entity to orbit around." },
            altitudeFromSurface = { type = "number", default = 0, description = "Distance buffer from the target's center." },
            speed = { type = "number", default = 0.5, description = "Speed of the circular orbit (radians per second)." },
            orbitPlane = { type = "string", default = "xz", description = "The 2D plane to orbit on: 'xz' (default), 'xy', or 'yz'." },
            initialAngle = { type = "number", default = 0, description = "Starting angle in radians." }
        }
    },

    init = function(self)
        local props = self.properties or {}
        self.state.target = scene.getEntity(props.targetEntityId)
        if not self.state.angle then
            self.state.angle = props.initialAngle or 0
        end
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
        local altitudeFromSurface = props.altitudeFromSurface or 0
        local speed = props.speed or 0.5
        local orbitPlane = props.orbitPlane or "xz"

        -- Default target radius to 1 unit until geometry radii are fully bridged
        local targetRadius = 1
        local orbitDistance = targetRadius + altitudeFromSurface

        local secs = dt / 1000
        self.state.angle = self.state.angle + (speed * secs)

        local a = self.state.angle
        local tp = target:getPosition()
        if not tp then return end

        local x, y, z = tp.x, tp.y, tp.z

        if orbitPlane == "xz" then
            x = tp.x + math.cos(a) * orbitDistance
            z = tp.z + math.sin(a) * orbitDistance
        elseif orbitPlane == "xy" then
            x = tp.x + math.cos(a) * orbitDistance
            y = tp.y + math.sin(a) * orbitDistance
        elseif orbitPlane == "yz" then
            y = tp.y + math.cos(a) * orbitDistance
            z = tp.z + math.sin(a) * orbitDistance
        end

        self:setPosition(x, y, z)
    end
}
