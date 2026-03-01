-- =======================================================================
-- billboard.lua
-- Makes the entity always face the camera entity.
-- Optionally locks rotation to the Y axis only (cylindrical billboard).
-- =======================================================================

---@type ScriptBlueprint<BillboardProps, {}>
return {
    schema = {
        name = "Billboard",
        description = "Entity always faces the camera. Optionally Y-locked.",
        properties = {
            cameraEntity = { type = "entity", required = true, default = "", description = "The camera entity to face." },
            lockY        = { type = "boolean", default = false, description = "Only rotate around the Y axis." }
        }
    },

    ---@param self ScriptInstance<BillboardProps, {}>
    ---@param dt number
    lateUpdate = function(self, dt)
        local cam = self.properties.cameraEntity
        if not cam or not cam:isValid() then return end

        local myPos  = self:getPosition()
        local camPos = cam:getPosition()

        if self.properties.lockY then
            -- Y-locked: only rotate around Y axis
            local dir = math.vec3(camPos.x - myPos.x, 0, camPos.z - myPos.z)
            if dir:lengthSq() < 1e-8 then return end
            local target = myPos + dir
            self:lookAt(target)
        else
            self:lookAt(camPos)
        end
    end
}
