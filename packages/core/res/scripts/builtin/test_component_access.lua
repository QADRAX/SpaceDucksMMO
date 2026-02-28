-- test_component_access.lua
---@class TestComponentProps
---@field rb table
---@field speed number

---@type ScriptBlueprint<TestComponentProps, any>
return {
    schema = {
        name = "Test Component Access",
        properties = {
            rb = { type = "component", componentType = "rigidBody", description = "A reference to a rigid body!" },
            speed = { type = "number", default = 5 }
        }
    },
    ---@param self ScriptInstance<TestComponentProps, any>
    ---@param dt number
    update = function(self, dt)
        -- 1. Direct component access
        local p = self.transform.position

        -- 2. getComponent method
        local tr = self:getComponent("transform")
        if tr then
            tr.position = math.vec3(p.x, p.y + dt * 0.001, p.z)
        end

        -- 3. Hydrated component proxy
        if self.properties.rb then
            self.properties.rb.linearVelocity = math.vec3(0, self.properties.speed, 0)
        end
    end
}
