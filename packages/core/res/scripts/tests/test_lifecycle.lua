---@class TestLifecycleState
---@field initCalled boolean
---@field updateCalled number

---@type ScriptBlueprint<any, TestLifecycleState>
return {
    schema = {
        name = "Test Lifecycle",
        description = "A script to verify all lifecycle hooks are correctly called in tests."
    },

    ---@param self ScriptInstance<any, TestLifecycleState>
    init = function(self)
        if not self.state then
            print("[Test] ERROR: self.state is nil in init!")
            return
        end
        self.state.initCalled = true
        self.state.updateCalled = 0
        print("[Test] init called, state type: " .. type(self.state))
    end,


    ---@param self ScriptInstance<any, TestLifecycleState>
    update = function(self)
        self.state.updateCalled = self.state.updateCalled + 1
        if self.state.updateCalled == 1 then
            print("[Test] first update")
        end
    end
}
