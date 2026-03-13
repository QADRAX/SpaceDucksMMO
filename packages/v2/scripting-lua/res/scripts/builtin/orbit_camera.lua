-- =======================================================================
-- orbit_camera.lua (V2)
-- Orbits the entity around a target entity on a configurable plane.
-- =======================================================================

---@class OrbitCameraPropsV2
---@field targetEntityId EntityWrapperV2 Central entity to orbit around (entityRef).
---@field altitudeFromSurface number Distance buffer from target center. Default: 0.
---@field speed number Orbit speed (radians per second). Default: 0.5.
---@field orbitPlane string Orbit plane: 'xz', 'xy', or 'yz'. Default: "xz".
---@field initialAngle number Starting angle in radians. Default: 0.

---@class OrbitCameraStateV2
---@field angle number

---@class OrbitCameraScript : ScriptInstanceV2
---@field properties OrbitCameraPropsV2
---@field state OrbitCameraStateV2
local OrbitCamera = {
    schema = {
        name = "Orbit Camera (V2)",
        description = "Orbits this entity around a target at a fixed distance and speed.",
        properties = {
            targetEntityId      = { type = "entityRef", default = "", description = "Central entity to orbit around." },
            altitudeFromSurface = { type = "number", default = 0, description = "Distance buffer from the target's center." },
            speed               = { type = "number", default = 0.5, description = "Orbit speed (radians per second)." },
            orbitPlane          = { type = "string", default = "xz", description = "Orbit plane: 'xz', 'xy', or 'yz'." },
            initialAngle        = { type = "number", default = 0, description = "Starting angle in radians." }
        }
    }
}

function OrbitCamera:init()
    self.state.angle = self.properties.initialAngle or 0
end

function OrbitCamera:update(dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local props = self.properties
    local altitudeFromSurface = props.altitudeFromSurface
    local speed = props.speed
    local orbitPlane = props.orbitPlane

    if not self.state.angle then
        self.state.angle = props.initialAngle
    end

    local orbitDistance = 1 + altitudeFromSurface
    self.state.angle = self.state.angle + (speed * dt)

    local a = self.state.angle
    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local offsetX, offsetY, offsetZ = 0, 0, 0
    if orbitPlane == "xz" then
        offsetX = math.cos(a) * orbitDistance
        offsetZ = math.sin(a) * orbitDistance
    elseif orbitPlane == "xy" then
        offsetX = math.cos(a) * orbitDistance
        offsetY = math.sin(a) * orbitDistance
    elseif orbitPlane == "yz" then
        offsetY = math.cos(a) * orbitDistance
        offsetZ = math.sin(a) * orbitDistance
    end

    self.entity.components.transform.setPosition(
        tpRaw.x + offsetX,
        tpRaw.y + offsetY,
        tpRaw.z + offsetZ
    )
end

return OrbitCamera
