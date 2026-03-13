-- Minimal test: update hook only, no bridges.
-- Isolates: runFrameHooks, update pipeline, dt passing.
-- Verification: properties.updateCount incremented each frame.

---@class MinimalUpdatePropsV2
---@field updateCount number

---@class MinimalUpdateScript : ScriptInstanceV2
---@field properties MinimalUpdatePropsV2

return {
    ---@param self MinimalUpdateScript
    init = function(self)
        self.properties.updateCount = 0
    end,
    ---@param self MinimalUpdateScript
    ---@param dt number
    update = function(self, dt)
        self.properties.updateCount = (self.properties.updateCount or 0) + 1
    end
}
