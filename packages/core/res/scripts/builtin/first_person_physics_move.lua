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

---@class FirstPersonPhysicsMoveState
---@field flyModeEnabled boolean

---@type ScriptBlueprint<FirstPersonPhysicsMoveProps, FirstPersonPhysicsMoveState>
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

    ---@param self ScriptInstance<FirstPersonPhysicsMoveProps, FirstPersonPhysicsMoveState>
    ---@param dt number
    update = function(self, dt)
        -- 1. Read input
        local w                 = input.isKeyPressed("w")
        local s                 = input.isKeyPressed("s")
        local a                 = input.isKeyPressed("a")
        local d                 = input.isKeyPressed("d")
        local up                = input.isKeyPressed("space")
        local down              = input.isKeyPressed("leftcontrol") or input.isKeyPressed("c")
        local shift             = input.isKeyPressed("leftshift")

        local flyMode           = self.properties.flyMode
        local moveSpeed         = self.properties.moveSpeed
        local sprintMultiplier  = self.properties.sprintMultiplier
        local maxAcceleration   = self.properties.maxAcceleration
        local brakeDeceleration = self.properties.brakeDeceleration

        -- 2. Build local-space movement vector
        local mv                = math.vec3.zero()
        if w then mv.z = -1 end
        if s then mv.z = 1 end
        if a then mv.x = -1 end
        if d then mv.x = 1 end

        if flyMode then
            if up then mv.y = 1 end
            if down then mv.y = -1 end
        end

        -- 3. Prepare vectors
        local forward = self:getForward()
        local right   = self:getRight()

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

        if worldMove:length() > 0 then
            worldMove = worldMove:normalize()
        end

        -- 4. Calculate desired vs current velocity
        local speed     = moveSpeed * (shift and sprintMultiplier or 1)
        local targetVel = worldMove * speed
        local curVel    = self:getLinearVelocity()

        if not flyMode then
            targetVel.y = curVel.y -- Preserve gravity
        end

        -- 5. Accelerate / Brake using impulses
        local secs = dt / 1000

        if worldMove:length() > 0 or (flyMode and mv.y ~= 0) then
            -- Accelerating
            local velErr = targetVel - curVel
            if not flyMode then velErr.y = 0 end

            local deltaV = clampMagnitude(velErr, maxAcceleration * secs)
            if deltaV.x == deltaV.x and deltaV.y == deltaV.y and deltaV.z == deltaV.z then
                self:applyImpulse(deltaV)
            end
            return
        end

        -- 6. Brake: no input, slow down
        local brakeTarget = curVel * -1
        if not flyMode then brakeTarget.y = 0 end
        local brakeDeltaV = clampMagnitude(brakeTarget, brakeDeceleration * secs)
        self:applyImpulse(brakeDeltaV)
    end
}
