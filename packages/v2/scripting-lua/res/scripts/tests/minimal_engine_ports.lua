-- Minimal test: init calls engine_ports (custom port).
-- Isolates: engine_ports injection, port resolution.
-- Verification: properties.greeting set from port.hello() result.

---@class MinimalEnginePortsPropsV2
---@field portKey string
---@field greeting string

---@class MinimalEnginePortsScript : ScriptInstanceV2
---@field properties MinimalEnginePortsPropsV2

return {
    ---@param self MinimalEnginePortsScript
    init = function(self)
        local portKey = self.properties.portKey or "io:test-custom"
        local port = engine_ports and engine_ports[portKey]
        if port and port.hello then
            self.properties.greeting = port.hello("Test")
        else
            self.properties.greeting = "no-port"
        end
    end
}
