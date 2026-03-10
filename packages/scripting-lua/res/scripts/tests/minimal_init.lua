-- Minimal test: init only, no bridges, no self.entity.
-- Isolates: slot creation, __LoadSlot, __WrapSelf, init hook.
-- Verification: properties.initCalled = true (readable from ECS snapshot).
return {
    init = function(self)
        self.properties.initCalled = true
    end
}
