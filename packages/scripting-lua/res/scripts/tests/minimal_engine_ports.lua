-- Minimal test: init calls engine_ports (custom port).
-- Isolates: engine_ports injection, port resolution.
-- Verification: properties.greeting set from port.hello() result.
return {
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
