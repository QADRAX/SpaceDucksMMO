-- =======================================================================
-- first_person_move.lua (V2)
-- Kinematic WASD movement for spectator cameras, ghosts, and editors.
-- Uses action-based input (agnostic of keyboard/gamepad).
-- Does NOT require a physics rigid body — directly sets entity position.
-- =======================================================================

---@class FirstPersonMovePropsV2
---@field moveSpeed number Base walking speed (units per second). Default: 5.
---@field sprintMultiplier number Speed multiplier when holding Shift. Default: 2.
---@field flyMode boolean If true, Space/Ctrl move vertically. Default: false.

---@class FirstPersonMoveScript : ScriptInstanceV2
---@field properties FirstPersonMovePropsV2
local FirstPersonMove = {
    schema = {
        name = "First Person Move (Kinematic) (V2)",
        description = "WASD movement and optional flying. Uses action-based input (keyboard + gamepad).",
        properties = {
            moveSpeed        = { type = "number", default = 5, description = "Base walking speed (units per second)." },
            sprintMultiplier = { type = "number", default = 2, description = "Speed multiplier when holding Shift." },
            flyMode          = { type = "boolean", default = false, description = "If true, Space/Ctrl move vertically." }
        }
    }
}

function FirstPersonMove:update(dt)
    local forward  = Engine.Input.getAction("moveForward")
    local backward = Engine.Input.getAction("moveBackward")
    local left     = Engine.Input.getAction("moveLeft")
    local right    = Engine.Input.getAction("moveRight")
    local up       = Engine.Input.getAction("jump")
    local down     = Engine.Input.getAction("flyDown")
    local sprint   = Engine.Input.getAction("sprint")

    local flyMode = self.properties.flyMode

    local mv = math.vec3.new(right - left, 0, backward - forward)
    if flyMode then
        mv.y = up - down
    end

    if mv:length() <= 0 then return end
    mv = mv:normalize()

    ---@type TransformV2
    local transform = self.entity.components.transform
    local forwardRaw = transform.getForward()
    local rightRaw   = transform.getRight()
    local forward = math.vec3.new(forwardRaw.x, forwardRaw.y, forwardRaw.z)
    local right   = math.vec3.new(rightRaw.x, rightRaw.y, rightRaw.z)

    if not flyMode then
        forward.y = 0
        if forward.x == 0 and forward.z == 0 then forward.z = 1 end
        forward = forward:normalize()

        right.y = 0
        right = right:normalize()
    end

    local worldMove = (forward * mv.z) + (right * mv.x)
    if flyMode then
        worldMove.y = worldMove.y + mv.y
    end

    if worldMove:length() == 0 then return end
    worldMove = worldMove:normalize()

    local speed = self.properties.moveSpeed * (sprint > 0 and self.properties.sprintMultiplier or 1)
    local curRaw = transform.getPosition()
    local cur = math.vec3.new(curRaw.x, curRaw.y, curRaw.z)

    local newPos = cur + (worldMove * (speed * dt))
    transform.setPosition(newPos.x, newPos.y, newPos.z)
end

return FirstPersonMove
