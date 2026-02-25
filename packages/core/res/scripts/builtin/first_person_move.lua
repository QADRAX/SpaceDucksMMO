---@type ScriptModule
return {
    schema = {
        name = "First Person Move (Kinematic)",
        description =
        "Handles unhindered WASD movement and flying without relying on the physics engine. Useful for standard ghosts, editors, and spectator cameras.",
        properties = {
            moveSpeed = { type = "number", default = 5, description = "Base walking speed." },
            sprintMultiplier = { type = "number", default = 2, description = "Speed multiplier when holding Shift." },
            flyMode = { type = "boolean", default = false, description = "If true, Space/Ctrl will move the entity up and down freely on the global Y axis." }
        }
    },

    update = function(self, dt)
        local keyboard = input

        local forwardKey = keyboard.isKeyPressed("w")
        local backKey = keyboard.isKeyPressed("s")
        local leftKey = keyboard.isKeyPressed("a")
        local rightKey = keyboard.isKeyPressed("d")
        local upKey = keyboard.isKeyPressed("space")
        local downKey = keyboard.isKeyPressed("control")
        local shift = keyboard.isKeyPressed("shift")

        local mv = { x = 0, y = 0, z = 0 }
        if forwardKey then mv.z = mv.z + 1 end
        if backKey then mv.z = mv.z - 1 end
        if leftKey then mv.x = mv.x - 1 end
        if rightKey then mv.x = mv.x + 1 end

        local props = self.properties or {}
        local moveSpeed = props.moveSpeed or 5
        local sprintMultiplier = props.sprintMultiplier or 2
        local flyMode = props.flyMode or false

        local secs = dt / 1000
        local speed = moveSpeed * (shift and sprintMultiplier or 1)

        if flyMode then
            if upKey then mv.y = mv.y + 1 end
            if downKey then mv.y = mv.y - 1 end
        end

        local len = math.sqrt(mv.x * mv.x + mv.y * mv.y + mv.z * mv.z)
        if len <= 0 then return end
        mv.x = mv.x / len
        mv.y = mv.y / len
        mv.z = mv.z / len

        local forward = self:getForward()
        local right = self:getRight()
        local worldUp = { x = 0, y = 1, z = 0 }

        if not flyMode then
            forward.y = 0
            local flen = math.sqrt(forward.x * forward.x + forward.z * forward.z)
            if flen == 0 then flen = 1 end
            forward.x = forward.x / flen
            forward.z = forward.z / flen
        end

        local moveWorld = {
            x = forward.x * mv.z + right.x * mv.x + (flyMode and worldUp.x * mv.y or 0),
            y = forward.y * mv.z + right.y * mv.x + (flyMode and worldUp.y * mv.y or 0),
            z = forward.z * mv.z + right.z * mv.x + (flyMode and worldUp.z * mv.y or 0)
        }

        local mlen = math.sqrt(moveWorld.x * moveWorld.x + moveWorld.y * moveWorld.y + moveWorld.z * moveWorld.z)
        if mlen == 0 then mlen = 1 end
        moveWorld.x = moveWorld.x / mlen
        moveWorld.y = moveWorld.y / mlen
        moveWorld.z = moveWorld.z / mlen

        local delta = {
            x = moveWorld.x * speed * secs,
            y = moveWorld.y * speed * secs,
            z = moveWorld.z * speed * secs
        }

        local cur = self:getPosition()
        if not cur then return end

        self:setPosition(cur.x + delta.x, cur.y + delta.y, cur.z + delta.z)
    end
}
