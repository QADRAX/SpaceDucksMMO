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
        local mv    = { x = 0, y = 0, z = 0 }
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
        local len = math.sqrt(mv.x * mv.x + mv.y * mv.y + mv.z * mv.z)
        if len <= 0 then return end
        mv.x          = mv.x / len
        mv.y          = mv.y / len
        mv.z          = mv.z / len

        -- 4. Transform to world space using entity orientation
        local forward = self:getForward()
        local right   = self:getRight()

        if not flyMode then
            -- Flatten forward onto XZ plane so vertical look doesn't affect speed
            forward.y = 0
            local flen = math.sqrt(forward.x * forward.x + forward.z * forward.z)
            if flen == 0 then flen = 1 end
            forward.x = forward.x / flen
            forward.z = forward.z / flen
        end

        local worldMove = {
            x = forward.x * mv.z + right.x * mv.x + (flyMode and mv.y or 0) * 0,
            y = forward.y * mv.z + right.y * mv.x + (flyMode and mv.y or 0),
            z = forward.z * mv.z + right.z * mv.x + (flyMode and mv.y or 0) * 0
        }

        -- Re-normalize after world transform
        local mlen = math.sqrt(worldMove.x * worldMove.x + worldMove.y * worldMove.y + worldMove.z * worldMove.z)
        if mlen == 0 then return end
        worldMove.x = worldMove.x / mlen
        worldMove.y = worldMove.y / mlen
        worldMove.z = worldMove.z / mlen

        -- 5. Apply movement
        local secs  = dt / 1000
        local speed = moveSpeed * (shift and sprintMultiplier or 1)
        local cur   = self:getPosition()

        self:setPosition(
            cur.x + worldMove.x * speed * secs,
            cur.y + worldMove.y * speed * secs,
            cur.z + worldMove.z * speed * secs
        )
    end
}
