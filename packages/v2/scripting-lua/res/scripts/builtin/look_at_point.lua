-- =======================================================================
-- look_at_point.lua (V2)
-- Continuously rotates the entity to face a fixed world-space coordinate.
-- =======================================================================

---@class LookAtPointPropsV2
---@field targetPoint Vec3V2|table World [x, y, z] coordinate to look at.

---@class LookAtPointScript : ScriptInstanceV2
---@field properties LookAtPointPropsV2
local LookAtPoint = {
    schema = {
        name = "Look at Point (V2)",
        description = "Continuously rotates this entity to face a static 3D world coordinate.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "World [x, y, z] coordinate to look at." }
        }
    }
}

function LookAtPoint:update(_dt)
    local targetPoint = self.properties.targetPoint
    if not targetPoint then return end

    local target = math.vec3.new(targetPoint.x, targetPoint.y, targetPoint.z)
    self.entity.components.transform.lookAt(target)
end

return LookAtPoint
