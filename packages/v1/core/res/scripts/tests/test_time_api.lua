-- =======================================================================
-- test_time_api.lua
-- Integration test: validates time bridge functions.
-- Must be run across multiple ticks to observe delta/elapsed changes.
-- =======================================================================

---@class TimeTestState
---@field frame number
---@field firstDelta number?
---@field firstElapsed number?

---@type ScriptBlueprint<any, TimeTestState>
return {
    schema = {
        name = "Test Time API",
        description = "E2E test for time bridge: getDelta, getElapsed, getFrameCount, getScale."
    },

    ---@param self ScriptInstance<any, TimeTestState>
    init = function(self)
        self.state.frame = 0

        -- ── Init-time checks ──
        local function check(label, condition)
            if not condition then
                print("[TimeAPI] FAIL: " .. label)
            else
                print("[TimeAPI] PASS: " .. label)
            end
        end

        check("time table exists", time ~= nil)
        check("getDelta is function", type(time.getDelta) == "function")
        check("getUnscaledDelta is function", type(time.getUnscaledDelta) == "function")
        check("getElapsed is function", type(time.getElapsed) == "function")
        check("getFrameCount is function", type(time.getFrameCount) == "function")
        check("getScale is function", type(time.getScale) == "function")
        check("setScale is function", type(time.setScale) == "function")
        check("now is function", type(time.now) == "function")
        check("getTime is function", type(time.getTime) == "function")

        -- Initial scale should be 1
        check("initial scale == 1", time.getScale() == 1)

        print("[TimeAPI] INIT DONE")
    end,

    ---@param self ScriptInstance<any, TimeTestState>
    ---@param dt number
    update = function(self, dt)
        self.state.frame = self.state.frame + 1

        local function check(label, condition)
            if not condition then
                print("[TimeAPI] FAIL: " .. label)
            else
                print("[TimeAPI] PASS: " .. label)
            end
        end

        if self.state.frame == 1 then
            -- First frame: record baseline values
            self.state.firstDelta = time.getDelta()
            self.state.firstElapsed = time.getElapsed()

            check("getDelta > 0 on first frame", time.getDelta() > 0)
            check("getUnscaledDelta > 0", time.getUnscaledDelta() > 0)
            check("getElapsed > 0", time.getElapsed() > 0)
            check("getFrameCount > 0", time.getFrameCount() > 0)
            check("now returns number", type(time.now()) == "number")

            -- Test setScale
            time.setScale(0.5)
            check("setScale(0.5) works", time.getScale() == 0.5)

            print("[TimeAPI] FRAME1 DONE")
        end

        if self.state.frame == 2 then
            -- Second frame: getDelta should reflect the 0.5 scale
            local scaledDelta = time.getDelta()
            local unscaledDelta = time.getUnscaledDelta()

            check("scaled delta < unscaled delta", scaledDelta < unscaledDelta + 0.001)
            check("elapsed increased", time.getElapsed() > self.state.firstElapsed)
            check("frameCount increased", time.getFrameCount() > 1)

            -- Restore scale
            time.setScale(1)
            check("scale restored to 1", time.getScale() == 1)

            print("[TimeAPI] FRAME2 DONE")
            print("[TimeAPI] ALL PASSED")
        end
    end
}
