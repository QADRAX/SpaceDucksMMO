-- Minimal test: init calls self.Transform.getLocalPosition() (bridge shortcut).
-- Uses self.Transform instead of self.entity.components.transform — same scoped bridge.
return {
    init = function(self)
        local pos = self.Transform and self.Transform.getLocalPosition()
        if pos then
            self.properties.startX = pos.x
            self.properties.startY = pos.y
            self.properties.startZ = pos.z
        end
        self.properties.initCalled = true
    end
}
