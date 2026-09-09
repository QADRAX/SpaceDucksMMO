-- Minimal test: init calls self.Transform.getLocalPosition() (bridge shortcut).
-- Uses self.Transform instead of self.entity.components.transform — same scoped bridge.

---@class MinimalTransformGlobalPropsV2
---@field initCalled boolean
---@field startX number
---@field startY number
---@field startZ number

---@class MinimalTransformGlobalScript : ScriptInstanceV2
---@field properties MinimalTransformGlobalPropsV2

return {
    ---@param self MinimalTransformGlobalScript
    init = function(self)
        if not self.Transform or not self.Transform.has() then
            self.properties.initCalled = false
            return
        end
        local pos = self.Transform.getLocalPosition()
        if pos then
            self.properties.startX = pos.x
            self.properties.startY = pos.y
            self.properties.startZ = pos.z
        end
        self.properties.initCalled = true
    end
}
