---@type ScriptModule
return {
    schema = {
        name = "Mouse Look",
        description =
        "Handles mouse pointer lock and freely rotates the entity based on mouse delta vectors (typical First-Person Camera behavior).",
        properties = {
            sensitivityX = { type = "number", default = 0.002, description = "Horizontal mouse sensitivity." },
            sensitivityY = { type = "number", default = 0.002, description = "Vertical mouse sensitivity." },
            invertY = { type = "boolean", default = false, description = "Invert vertical look axis." }
        }
    },

    update = function(self, dt)
        input.requestPointerLock()

        local md = input.getMouseDelta()
        if md.x == 0 and md.y == 0 then return end

        local props = self.properties or {}
        local sensitivityX = props.sensitivityX or 0.002
        local sensitivityY = props.sensitivityY or 0.002
        local invertY = props.invertY or false

        if not self.state.yaw then self.state.yaw = 0 end
        if not self.state.pitch then self.state.pitch = 0 end

        self.state.yaw = self.state.yaw - (md.x * sensitivityX)
        local inv = invertY and 1 or -1
        self.state.pitch = self.state.pitch + (inv * md.y * sensitivityY)

        local limit = (math.pi / 2) - 0.01
        if self.state.pitch > limit then self.state.pitch = limit end
        if self.state.pitch < -limit then self.state.pitch = -limit end

        self:setRotation(self.state.pitch, self.state.yaw, 0)
    end
}
