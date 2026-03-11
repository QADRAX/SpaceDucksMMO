-- Minimal test: init writes to self.properties.
-- Isolates: properties proxy, dirty tracking, flush to ECS.

---@class MinimalPropertiesPropsV2
---@field foo string

---@class MinimalPropertiesScript : ScriptInstanceV2
---@field properties MinimalPropertiesPropsV2

return {
    ---@param self MinimalPropertiesScript
    init = function(self)
        self.properties.foo = "bar"
    end
}
