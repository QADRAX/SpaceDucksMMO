-- =======================================================================
-- first_person_physics_move.lua
-- Physics-based WASD movement. Requires a RigidBody + Collider.
-- Uses impulses to reach target velocity, ensuring proper collisions.
-- =======================================================================

---Clamps a velocity vector's magnitude.
---@param v Vec3
---@param maxLen number
---@return Vec3
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
        description = "WASD physics movement via impulses. Requires rigidBody + collider.",
        properties = {
            moveSpeed         = { type = "number", default = 6, description = "Target linear velocity (units/s)." },
            sprintMultiplier  = { type = "number", default = 1.75, description = "Speed multiplier when holding Shift." },
            maxAcceleration   = { type = "number", default = 30, description = "Max acceleration impulse per frame." },
            brakeDeceleration = { type = "number", default = 40, description = "Deceleration when no input." },
            flyMode           = { type = "boolean", default = false, description = "If true, Space/Ctrl controls Y velocity." }
        }
    },

    update = function(self, dt)
        -- 1. Read input
        local w     = input.isKeyPressed("w")
        local s     = input.isKeyPressed("s")
        local a     = input.isKeyPressed("a")
        local d     = input.isKeyPressed("d")
        local up    = input.isKeyPressed("space")
        local down  = input.isKeyPressed("control")
        local shift = input.isKeyPressed("shift")

        local mv    = { x = 0, y = 0, z = 0 }
        if w then mv.z = mv.z + 1 end
        if s then mv.z = mv.z - 1 end
        if a then mv.x = mv.x - 1 end
        if d then mv.x = mv.x + 1 end

        local props             = self.properties or {}
        local moveSpeed         = props.moveSpeed or 6
        local sprintMultiplier  = props.sprintMultiplier or 1.75
        local maxAcceleration   = math.max(0, props.maxAcceleration or 30)
        local brakeDeceleration = math.max(0, props.brakeDeceleration or 40)
        local flyMode           = props.flyMode or false

        if flyMode then
            if up then mv.y = mv.y + 1 end
            if down then mv.y = mv.y - 1 end
        end

        local secs = math.max(0, dt) / 1000
        if secs <= 0 then return end

        local speed   = moveSpeed * (shift and sprintMultiplier or 1)
        local forward = self:getForward()
        local right   = self:getRight()

        -- Flatten forward for grounded movement
        if not flyMode then
            forward.y = 0
            local flen = math.sqrt(forward.x * forward.x + forward.z * forward.z)
            if flen == 0 then flen = 1 end
            forward.x = forward.x / flen
            forward.z = forward.z / flen
        end

        -- 2. Transform local input to world-space direction
        local moveWorld = {
            x = forward.x * mv.z + right.x * mv.x,
            y = forward.y * mv.z + right.y * mv.x + (flyMode and mv.y or 0),
            z = forward.z * mv.z + right.z * mv.x,
        }

        local mlen      = math.sqrt(moveWorld.x * moveWorld.x + moveWorld.y * moveWorld.y + moveWorld.z * moveWorld.z)
        local curVel    = self:getLinearVelocity() or { x = 0, y = 0, z = 0 }

        -- 3. Accelerate towards desired velocity
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

            local deltaV = clampMagnitude(velErr, maxAcceleration * secs)
            self:applyImpulse(deltaV.x, deltaV.y, deltaV.z)
            return
        end

        -- 4. Brake: no input, slow down
        local brakeTarget = {
            x = -curVel.x,
            y = flyMode and -curVel.y or 0,
            z = -curVel.z,
        }
        local brakeDeltaV = clampMagnitude(brakeTarget, brakeDeceleration * secs)
        self:applyImpulse(brakeDeltaV.x, brakeDeltaV.y, brakeDeltaV.z)
    end
}
