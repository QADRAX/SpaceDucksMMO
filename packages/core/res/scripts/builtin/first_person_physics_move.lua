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
    local len = v:length()
    if len <= 0 then return math.vec3.zero() end
    if len <= maxLen then return v:clone() end
    return v * (maxLen / len)
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

        local mv    = math.vec3.zero()
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
            if forward.x == 0 and forward.z == 0 then forward.z = 1 end
            forward = forward:normalize()
        end

        -- 2. Transform local input to world-space direction
        local moveWorld = (forward * mv.z) + (right * mv.x)
        if flyMode then moveWorld.y = moveWorld.y + mv.y end

        local mlen   = moveWorld:length()
        local curVel = self:getLinearVelocity()

        -- 3. Accelerate towards desired velocity
        if mlen > 1e-6 then
            moveWorld = moveWorld:normalize()

            local desiredVel = moveWorld * speed
            if not flyMode then desiredVel.y = curVel.y end

            local velErr = desiredVel - curVel
            if not flyMode then velErr.y = 0 end

            local deltaV = clampMagnitude(velErr, maxAcceleration * secs)
            self:applyImpulse(deltaV)
            return
        end

        -- 4. Brake: no input, slow down
        local brakeTarget = -curVel
        if not flyMode then brakeTarget.y = 0 end
        local brakeDeltaV = clampMagnitude(brakeTarget, brakeDeceleration * secs)
        self:applyImpulse(brakeDeltaV)
    end
}
