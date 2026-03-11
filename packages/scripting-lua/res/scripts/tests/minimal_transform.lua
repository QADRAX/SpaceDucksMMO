-- Minimal test: init calls self.entity.components.transform.getLocalPosition().
-- Isolates: entity proxy, components proxy, transform bridge.
-- Verification: properties.initCalled = true, properties.startX/Y/Z from position.

---@class MinimalTransformPropsV2
---@field initCalled boolean
---@field startX number
---@field startY number
---@field startZ number

---@class MinimalTransformScript : ScriptInstanceV2
---@field properties MinimalTransformPropsV2

return {
    ---@param self MinimalTransformScript
    init = function(self)
        local pos = self.entity.components.transform.getLocalPosition()
        self.properties.startX = pos.x
        self.properties.startY = pos.y
        self.properties.startZ = pos.z
        self.properties.initCalled = true
    end
}
