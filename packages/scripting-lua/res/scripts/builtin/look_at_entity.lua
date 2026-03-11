-- =======================================================================
-- look_at_entity.lua (V2)
-- Smoothly rotates the entity to face a target entity.
-- Only affects rotation — does NOT move the entity.
-- =======================================================================

---@class LookAtEntityPropsV2
---@field targetEntityId EntityWrapperV2 Target entity to look at (entityRef).
---@field speed number Rotation smoothing speed. Default: 5.
---@field lookAtOffset Vec3V2|table World-space offset applied to the target position. Default: {0,0,0}.

---@class LookAtEntityScript : ScriptInstanceV2
---@field properties LookAtEntityPropsV2
local LookAtEntity = {
    schema = {
        name = "Look at Entity (V2)",
        description = "Smoothly rotates this entity to face a target entity. Rotation only.",
        properties = {
            targetEntityId = { type = "entityRef", default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 5, description = "Rotation smoothing speed." },
            lookAtOffset   = { type = "vec3", default = { 0, 0, 0 }, description = "World-space offset applied to the target position." }
        }
    }
}

function LookAtEntity:update(_dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local offset = self.properties.lookAtOffset or { x = 0, y = 0, z = 0 }
    local targetPos = math.vec3.new(
        tpRaw.x + (offset.x or 0),
        tpRaw.y + (offset.y or 0),
        tpRaw.z + (offset.z or 0)
    )
    self.entity.components.transform.lookAt(targetPos)
end

return LookAtEntity
