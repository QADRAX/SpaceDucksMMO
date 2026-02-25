local function clampMagnitude(v, maxLen)
    local len = math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    if len <= 0 then return { x = 0, y = 0, z = 0 } end
    if len <= maxLen then return v end
    local s = maxLen / len
    return { x = v.x * s, y = v.y * s, z = v.z * s }
end

---@type ScriptModule
return {
    schema = {
        name = "First Person Physics Move",
        description =
        "Handles WASD movement strictly via the physics engine, requiring a Collider and RigidBody. It manipulates linear velocity and applies forces rather than teleporting position.",
        properties = {
            moveSpeed = { type = "number", default = 6, description = "Target linear velocity speed." },
            sprintMultiplier = { type = "number", default = 1.75, description = "Speed multiplier when holding Shift." },
            maxAcceleration = { type = "number", default = 30, description = "Maximum impulse to reach target speed." },
            brakeDeceleration = { type = "number", default = 40, description = "How fast the entity stops when no keys are pressed." },
            flyMode = { type = "boolean", default = false, description = "If true, Space/Ctrl controls Y velocity and physics gravity should be disabled." }
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
        local moveSpeed = props.moveSpeed or 6
        local sprintMultiplier = props.sprintMultiplier or 1.75
        local maxAcceleration = math.max(0, props.maxAcceleration or 30)
        local brakeDeceleration = math.max(0, props.brakeDeceleration or 40)
        local flyMode = props.flyMode or false

        if flyMode then
            if upKey then mv.y = mv.y + 1 end
            if downKey then mv.y = mv.y - 1 end
        end

        local secs = math.max(0, dt) / 1000
        if secs <= 0 then return end

        local speed = moveSpeed * (shift and sprintMultiplier or 1)

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
            z = forward.z * mv.z + right.z * mv.x + (flyMode and worldUp.z * mv.y or 0),
        }

        local mlen = math.sqrt(moveWorld.x * moveWorld.x + moveWorld.y * moveWorld.y + moveWorld.z * moveWorld.z)
        local curVel = self:getLinearVelocity() or { x = 0, y = 0, z = 0 }

        if mlen > 1e-6 then
            moveWorld.x = moveWorld.x / mlen
            moveWorld.y = moveWorld.y / mlen
            moveWorld.z = moveWorld.z / mlen

            local desiredVel = {
                x = moveWorld.x * speed,
                y = flyMode and (moveWorld.y * speed) or curVel.y,
                z = moveWorld.z * speed,
            }

            local velErr = {
                x = desiredVel.x - curVel.x,
                y = flyMode and (desiredVel.y - curVel.y) or 0,
                z = desiredVel.z - curVel.z,
            }

            local maxDeltaV = maxAcceleration * secs
            local deltaV = clampMagnitude(velErr, maxDeltaV)
            self:applyImpulse(deltaV.x, deltaV.y, deltaV.z)
            return
        end

        -- Brake
        local brakeTarget = {
            x = -curVel.x,
            y = flyMode and -curVel.y or 0,
            z = -curVel.z,
        }
        local maxBrakeDeltaV = brakeDeceleration * secs
        local brakeDeltaV = clampMagnitude(brakeTarget, maxBrakeDeltaV)
        self:applyImpulse(brakeDeltaV.x, brakeDeltaV.y, brakeDeltaV.z)
    end
}
