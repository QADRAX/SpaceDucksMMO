-- =======================================================================
-- first_person_look.lua (V2)
-- First-person camera rotation via pointer lock and mouse delta.
-- Uses lookHorizontal/lookVertical actions (mouse + gamepad stick).
-- =======================================================================

---@class FirstPersonLookPropsV2
---@field sensitivity number Mouse/gamepad look sensitivity. Default: 1.

---@class FirstPersonLookScript : ScriptInstanceV2
---@field properties FirstPersonLookPropsV2
local FirstPersonLook = {
    schema = {
        name = "First Person Look (V2)",
        description = "First-person camera rotation via pointer lock and mouse delta.",
        properties = {
            sensitivity = { type = "number", default = 1, description = "Look sensitivity multiplier." }
        }
    }
}

function FirstPersonLook:update(dt)
    -- Request pointer lock on first click
    if not Engine.Input.isPointerLocked() then
        if Engine.Input.getMouseButtons().left then
            Engine.Input.requestPointerLock()
        end
        return
    end

    local look = Engine.Input.getAction2("lookHorizontal", "lookVertical")
    if look.x == 0 and look.y == 0 then return end

    local sens = self.properties.sensitivity or 1
    local yaw = -look.x * sens
    local pitch = -look.y * sens

    ---@type TransformV2
    local transform = self.entity.components.transform
    local rot = transform.getRotation()
    local euler = math.vec3.new(rot.x, rot.y, rot.z)

    euler.y = euler.y + yaw
    euler.x = math.max(-1.57, math.min(1.57, euler.x + pitch))

    transform.setRotation(euler.x, euler.y, euler.z)
end

return FirstPersonLook
