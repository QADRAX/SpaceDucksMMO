-- =======================================================================
-- smooth_look_at.lua (V2)
-- Eased rotation towards a target entity.
-- =======================================================================

---@param a number
---@param b number
---@param t number
---@return number
local function lerpAngle(a, b, t)
    local diff = b - a
    while diff > math.pi do diff = diff - 2 * math.pi end
    while diff < -math.pi do diff = diff + 2 * math.pi end
    return a + diff * t
end

---@class SmoothLookAtPropsV2
---@field targetEntityId EntityWrapperV2 Target entity to look at (entityRef).
---@field speed number Rotation speed. Default: 3.
---@field easing string Easing function. Default: "sineOut".
---@field offset Vec3V2|table Offset applied to target position. Default: {0,0,0}.

---@class SmoothLookAtScript : ScriptInstanceV2
---@field properties SmoothLookAtPropsV2
local SmoothLookAt = {
    schema = {
        name = "Smooth Look At (V2)",
        description = "Smoothly rotates to face a target using easing curves.",
        properties = {
            targetEntityId = { type = "entityRef", default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 3, description = "Rotation speed." },
            easing         = { type = "string", default = "sineOut", description = "Easing function." },
            offset         = { type = "vec3", default = { 0, 0, 0 }, description = "Offset applied to target position." }
        }
    }
}

function SmoothLookAt:update(dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local props  = self.properties
    local speed  = props.speed or 3
    local offset = props.offset

    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local ox = offset and (offset.x or offset[1] or 0) or 0
    local oy = offset and (offset.y or offset[2] or 0) or 0
    local oz = offset and (offset.z or offset[3] or 0) or 0

    local desiredX = tpRaw.x + ox
    local desiredY = tpRaw.y + oy
    local desiredZ = tpRaw.z + oz

    local cur = self.entity.components.transform.getPosition()
    local dirX = desiredX - cur.x
    local dirY = desiredY - cur.y
    local dirZ = desiredZ - cur.z

    local desiredYaw     = math.atan(dirX, dirZ)
    local horizontalDist = math.sqrt(dirX * dirX + dirZ * dirZ)
    local desiredPitch   = -math.atan(dirY, horizontalDist)

    local rot = self.entity.components.transform.getRotation()

    local raw = math.ext.clamp(speed * dt, 0, 1)
    local t   = math.ext.ease(props.easing or "sineOut", raw)

    local newPitch = lerpAngle(rot.x, desiredPitch, t)
    local newYaw   = lerpAngle(rot.y, desiredYaw, t)

    self.entity.components.transform.setRotation(newPitch, newYaw, 0)
end

return SmoothLookAt
