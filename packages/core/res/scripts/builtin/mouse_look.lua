-- =======================================================================
-- mouse_look.lua
-- First-person mouse look with pointer lock. Controls entity rotation
-- via yaw (horizontal) and pitch (vertical) stored in state.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Mouse Look",
        description = "First-person camera rotation via pointer lock and mouse delta.",
        properties = {
            sensitivityX = { type = "number", default = 0.002, description = "Horizontal mouse sensitivity." },
            sensitivityY = { type = "number", default = 0.002, description = "Vertical mouse sensitivity." },
            invertY      = { type = "boolean", default = false, description = "Invert vertical look axis." }
        }
    },

    update = function(self, dt)
        -- Request pointer lock so the cursor is hidden and deltas are infinite
        input.requestPointerLock()

        local md = input.getMouseDelta()
        if md.x == 0 and md.y == 0 then return end

        local props        = self.properties or {}
        local sensitivityX = props.sensitivityX or 0.002
        local sensitivityY = props.sensitivityY or 0.002
        local invertY      = props.invertY or false

        -- Initialize accumulated angles on first frame
        if not self.state.yaw then self.state.yaw = 0 end
        if not self.state.pitch then self.state.pitch = 0 end

        -- Accumulate rotation
        self.state.yaw   = self.state.yaw - (md.x * sensitivityX)
        self.state.pitch = self.state.pitch + ((invertY and 1 or -1) * md.y * sensitivityY)

        -- Clamp pitch to prevent flipping
        local limit      = (math.pi / 2) - 0.01
        self.state.pitch = math.ext.clamp(self.state.pitch, -limit, limit)

        self:setRotation(math.vec3(self.state.pitch, self.state.yaw, 0))
    end
}
