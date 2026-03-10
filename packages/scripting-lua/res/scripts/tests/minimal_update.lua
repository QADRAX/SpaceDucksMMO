-- Minimal test: update hook only, no bridges.
-- Isolates: runFrameHooks, update pipeline, dt passing.
-- Verification: properties.updateCount incremented each frame.
return {
    init = function(self)
        self.properties.updateCount = 0
    end,
    update = function(self, dt)
        self.properties.updateCount = (self.properties.updateCount or 0) + 1
    end
}
