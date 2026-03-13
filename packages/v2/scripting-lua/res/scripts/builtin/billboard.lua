-- =======================================================================
-- billboard.lua (V2)
-- Makes the entity always face the camera entity.
-- Optionally locks rotation to the Y axis only (cylindrical billboard).
-- =======================================================================

---@class BillboardPropsV2
---@field cameraEntity EntityWrapperV2 The camera entity to face (entityRef).
---@field lockY boolean Only rotate around the Y axis. Default: false.

---@class BillboardScript : ScriptInstanceV2
---@field properties BillboardPropsV2
local Billboard = {
    schema = {
        name = "Billboard (V2)",
        description = "Entity always faces the camera. Optionally Y-locked.",
        properties = {
            cameraEntity = { type = "entityRef", default = "", description = "The camera entity to face." },
            lockY        = { type = "boolean", default = false, description = "Only rotate around the Y axis." }
        }
    }
}

function Billboard:lateUpdate(_dt)
    local cam = self.references.cameraEntity
    if not cam or not self.Scene.exists(cam.id) then return end

    local myPosRaw  = self.entity.components.transform.getPosition()
    local camPosRaw = cam.components.transform.getPosition()

    local myPos  = math.vec3.new(myPosRaw.x, myPosRaw.y, myPosRaw.z)
    local camPos = math.vec3.new(camPosRaw.x, camPosRaw.y, camPosRaw.z)

    if self.properties.lockY then
        local dir = math.vec3.new(camPos.x - myPos.x, 0, camPos.z - myPos.z)
        if dir:length() < 1e-4 then return end
        local target = myPos + dir
        self.entity.components.transform.lookAt(target)
    else
        self.entity.components.transform.lookAt(camPos)
    end
end

return Billboard
