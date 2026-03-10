-- Minimal test: init writes to self.properties.
-- Isolates: properties proxy, dirty tracking, flush to ECS.
return {
    init = function(self)
        self.properties.foo = "bar"
    end
}
