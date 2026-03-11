-- Minimal test: init only, no bridges, no self.entity.
-- Isolates: slot creation, __LoadSlot, __WrapSelf, init hook.
-- Verification: properties.initCalled = true (readable from ECS snapshot).

---@class MinimalInitPropsV2
---@field initCalled boolean

---@class MinimalInitScript : ScriptInstanceV2
---@field properties MinimalInitPropsV2

return {
    ---@param self MinimalInitScript
    init = function(self)
        self.properties.initCalled = true
    end
}
