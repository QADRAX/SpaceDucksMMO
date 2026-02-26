-- =======================================================================
-- first_person_move.lua
-- Kinematic WASD movement for spectator cameras, ghosts, and editors.
-- Does NOT require a physics rigid body — directly sets entity position.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "First Person Move (Kinematic)",
        description = "WASD movement and optional flying. Moves the entity directly without physics.",
        properties = {
            moveSpeed        = { type = "number", default = 5, description = "Base walking speed (units per second)." },
            sprintMultiplier = { type = "number", default = 2, description = "Speed multiplier when holding Shift." },
            flyMode          = { type = "boolean", default = false, description = "If true, Space/Ctrl move vertically." }
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

        -- 2. Build local-space movement vector
        local mv    = math.vec3.zero()
        if w then mv.z = mv.z + 1 end
        if s then mv.z = mv.z - 1 end
        if a then mv.x = mv.x - 1 end
        if d then mv.x = mv.x + 1 end

        local props            = self.properties or {}
        local moveSpeed        = props.moveSpeed or 5
        local sprintMultiplier = props.sprintMultiplier or 2
        local flyMode          = props.flyMode or false

        if flyMode then
            if up then mv.y = mv.y + 1 end
            if down then mv.y = mv.y - 1 end
        end

        -- 3. Normalize to prevent faster diagonal movement
        if mv:length() <= 0 then return end
        mv            = mv:normalize()

        -- 4. Transform to world space using entity orientation
        local forward = self:getForward()
        local right   = self:getRight()

        if not flyMode then
            -- Flatten forward onto XZ plane so vertical look doesn't affect speed
            forward.y = 0
            if forward.x == 0 and forward.z == 0 then forward.z = 1 end
            forward = forward:normalize()

            -- Keep right strictly horizontal as well
            right.y = 0
            right = right:normalize()
        end

        local worldMove = (forward * mv.z) + (right * mv.x)
        if flyMode then
            worldMove.y = worldMove.y + mv.y
        end

        -- Re-normalize after world transform
        if worldMove:length() == 0 then return end
        worldMove   = worldMove:normalize()

        -- 5. Apply movement
        local secs  = dt / 1000
        local speed = moveSpeed * (shift and sprintMultiplier or 1)
        local cur   = self:getPosition()

        -- Look at how clean this is compared to manually adding x, y, z!
        self:setPosition(cur + (worldMove * speed * secs))
    end
}
