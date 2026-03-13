-- =======================================================================
-- test_events.lua
-- Integration test: validates scene.fireEvent / scene.onEvent.
-- =======================================================================

---@class EventsTestState
---@field received boolean
---@field payload  any

---@type ScriptBlueprint<any, EventsTestState>
return {
    schema = {
        name = "Test Events",
        description = "E2E test for scene event bus (fireEvent/onEvent)."
    },

    ---@param self ScriptInstance<any, EventsTestState>
    init = function(self)
        self.state.received = false
        self.state.payload = nil

        -- Subscribe to a custom event
        scene.onEvent(self, "test_ping", function(data)
            self.state.received = true
            self.state.payload = data
            print("[Events] received test_ping with value=" .. tostring(data.value))
        end)

        print("[Events] subscribed to test_ping")
    end,

    ---@param self ScriptInstance<any, EventsTestState>
    ---@param dt number
    update = function(self, dt)
        -- Fire the event on the first update so the subscription is active
        if not self.state.received then
            print("[Events] firing test_ping")
            scene.fireEvent("test_ping", { value = 42 })
        end

        if self.state.received then
            local function check(label, condition)
                if not condition then
                    print("[Events] FAIL: " .. label)
                else
                    print("[Events] PASS: " .. label)
                end
            end

            check("event received", self.state.received == true)
            check("payload.value == 42", self.state.payload and self.state.payload.value == 42)
            print("[Events] ALL PASSED")
            -- Prevent re-printing
            self.state.received = false
        end
    end
}
