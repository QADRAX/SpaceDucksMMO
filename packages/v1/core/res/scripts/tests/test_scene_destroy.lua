-- =======================================================================
-- test_scene_destroy.lua
-- Integration test: validates self:destroy() triggers entity removal.
-- =======================================================================

---@class DestroyTestState
---@field frame number

---@type ScriptBlueprint<any, DestroyTestState>
return {
    schema = {
        name = "Test Scene Destroy",
        description = "E2E test for self:destroy() calling scene.destroyEntity."
    },

    ---@param self ScriptInstance<any, DestroyTestState>
    init = function(self)
        self.state.frame = 0
        print("[Destroy] init called for " .. tostring(self.id))
    end,

    ---@param self ScriptInstance<any, DestroyTestState>
    ---@param dt number
    update = function(self, dt)
        self.state.frame = self.state.frame + 1
        if self.state.frame == 2 then
            print("[Destroy] calling self:destroy()")
            self:destroy()
        end
    end,

    ---@param self ScriptInstance<any, DestroyTestState>
    onDestroy = function(self)
        print("[Destroy] onDestroy called for " .. tostring(self.id))
    end
}
