-- =======================================================================
-- look_at_point.lua
-- Continuously rotates the entity to face a fixed world-space coordinate.
-- =======================================================================

---@class LookAtPoint : DuckEntity<LookAtPointProps, any>

---@type ScriptModule<LookAtPoint>
return {
    schema = {
        name = "Look at Point",
        description = "Continuously rotates this entity to face a static 3D world coordinate.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "World [x, y, z] coordinate to look at." }
        }
    },

    update = function(self, dt)
        local props = self.properties
        local targetPoint = props.targetPoint
        if not targetPoint then return end


        self:lookAt(math.vec3(targetPoint[1], targetPoint[2], targetPoint[3]))
    end
}

