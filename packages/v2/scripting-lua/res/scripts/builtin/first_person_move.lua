-- =======================================================================
-- first_person_move.lua (V2)
-- Kinematic WASD movement for spectator cameras, ghosts, and editors.
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
        description = "WASD movement and optional flying. Moves the entity directly without physics.",
        properties = {
            moveSpeed        = { type = "number", default = 5, description = "Base walking speed (units per second)." },
            sprintMultiplier = { type = "number", default = 2, description = "Speed multiplier when holding Shift." },
            flyMode          = { type = "boolean", default = false, description = "If true, Space/Ctrl move vertically." }
        }
    }
}

function FirstPersonMove:update(dt)
    local w     = Engine.Input.isKeyPressed("w")
    local s     = Engine.Input.isKeyPressed("s")
    local a     = Engine.Input.isKeyPressed("a")
    local d     = Engine.Input.isKeyPressed("d")
    local up    = Engine.Input.isKeyPressed("space")
    local down  = Engine.Input.isKeyPressed("leftcontrol") or Engine.Input.isKeyPressed("c")
    local shift = Engine.Input.isKeyPressed("leftshift")

    local flyMode = self.properties.flyMode

    local mv = math.vec3.new(0, 0, 0)
    if w then mv.z = -1 end
    if s then mv.z = 1 end
    if a then mv.x = -1 end
    if d then mv.x = 1 end

    if flyMode then
        if up then mv.y = 1 end
        if down then mv.y = -1 end
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

    local speed = self.properties.moveSpeed * (shift and self.properties.sprintMultiplier or 1)
    local curRaw = transform.getPosition()
    local cur = math.vec3.new(curRaw.x, curRaw.y, curRaw.z)

    local newPos = cur + (worldMove * (speed * dt))
    transform.setPosition(newPos.x, newPos.y, newPos.z)
end

return FirstPersonMove
