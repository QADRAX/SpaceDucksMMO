---@type ScriptModule
return {
    schema = {
        name = "Look at Point",
        description =
        "Continuously rotates the entity so that its forward vector points towards a specific static 3D coordinate.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "The [x, y, z] world coordinate array to look at." }
        }
    },

    update = function(self, dt)
        local props = self.properties or {}
        local targetPoint = props.targetPoint
        if not targetPoint then return end

        self:lookAt(targetPoint[1], targetPoint[2], targetPoint[3])
    end
}
