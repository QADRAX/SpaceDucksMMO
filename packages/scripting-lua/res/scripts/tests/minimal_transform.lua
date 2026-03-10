-- Minimal test: init calls self.entity.components.transform.getLocalPosition().
-- Isolates: entity proxy, components proxy, transform bridge.
-- Verification: properties.initCalled = true, properties.startX/Y/Z from position.
return {
    init = function(self)
        local pos = self.entity.components.transform.getLocalPosition()
        self.properties.startX = pos.x
        self.properties.startY = pos.y
        self.properties.startZ = pos.z
        self.properties.initCalled = true
    end
}
