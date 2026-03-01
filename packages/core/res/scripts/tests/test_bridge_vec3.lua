-- =======================================================================
-- test_bridge_vec3.lua
-- Integration test script: validates that bridge return values (getPosition,
-- getForward, etc.) arrive as proper Vec3 objects with metatables, operators,
-- and instance methods. Also validates vec3 property auto-hydration.
-- =======================================================================

---@class BridgeVec3TestProps
---@field targetEntityId DuckEntity
---@field offset Vec3

---@class BridgeVec3TestState
---@field passed boolean

---@type ScriptBlueprint<BridgeVec3TestProps, BridgeVec3TestState>
return {
    schema = {
        name = "Bridge Vec3 Test",
        description = "Integration test for Vec3 marshalling across the Lua/JS bridge.",
        properties = {
            targetEntityId = { type = "entity", default = "", description = "A target entity to test cross-entity getPosition." },
            offset         = { type = "vec3", default = { 1, 2, 3 }, description = "A vec3 property to test auto-hydration." }
        }
    },

    ---@param self ScriptInstance<BridgeVec3TestProps, BridgeVec3TestState>
    init = function(self)
        self.state.passed = true

        local function check(label, condition)
            if not condition then
                self.state.passed = false
                print("[Vec3Test] FAIL: " .. label)
            else
                print("[Vec3Test] PASS: " .. label)
            end
        end

        -- 1. self:getPosition() returns a proper Vec3
        local pos = self:getPosition()
        check("getPosition returns non-nil", pos ~= nil)
        check("getPosition has .x", pos.x ~= nil)
        check("getPosition has .y", pos.y ~= nil)
        check("getPosition has .z", pos.z ~= nil)

        -- 2. Vec3 :clone() method works
        local cloned = pos:clone()
        check("clone() works", cloned ~= nil)
        check("clone().x matches", cloned.x == pos.x)
        check("clone().y matches", cloned.y == pos.y)
        check("clone().z matches", cloned.z == pos.z)

        -- 3. Vec3 :length() method works
        local len = pos:length()
        check("length() returns number", type(len) == "number")

        -- 4. Vec3 arithmetic: addition
        local sum = pos + math.vec3(1, 1, 1)
        check("Vec3 + Vec3 works", sum ~= nil)
        check("addition .x correct", sum.x == pos.x + 1)
        check("addition .y correct", sum.y == pos.y + 1)
        check("addition .z correct", sum.z == pos.z + 1)

        -- 5. Vec3 arithmetic: subtraction
        local diff = pos - math.vec3(1, 0, 0)
        check("Vec3 - Vec3 works", diff ~= nil)
        check("subtraction .x correct", diff.x == pos.x - 1)

        -- 6. Vec3 :normalize() works
        local n = math.vec3(3, 0, 0):normalize()
        check("normalize() works", n ~= nil)
        check("normalize() length ~= 1", math.abs(n:length() - 1) < 0.001)

        -- 7. Vec3 :distanceTo() works
        local d = pos:distanceTo(math.vec3(0, 0, 0))
        check("distanceTo() returns number", type(d) == "number")

        -- 8. getForward() returns a Vec3
        local fwd = self:getForward()
        check("getForward returns non-nil", fwd ~= nil)
        check("getForward has .x", fwd.x ~= nil)
        local fwdLen = fwd:length()
        check("getForward is normalized (~1)", math.abs(fwdLen - 1) < 0.01)

        -- 9. getRotation() returns a Vec3
        local rot = self:getRotation()
        check("getRotation returns non-nil", rot ~= nil)
        check("getRotation has .x", rot.x ~= nil)
        local rotClone = rot:clone()
        check("getRotation clone works", rotClone ~= nil)

        -- 10. getScale() returns a Vec3
        local sc = self:getScale()
        check("getScale returns non-nil", sc ~= nil)
        check("getScale has .x", sc.x ~= nil)

        -- 11. Cross-entity: target:getPosition() works
        local target = self.properties.targetEntityId
        if target then
            local tp = target:getPosition()
            check("target:getPosition returns non-nil", tp ~= nil)
            check("target:getPosition has .x", tp.x ~= nil)
            local tpClone = tp:clone()
            check("target:getPosition():clone() works", tpClone ~= nil)
            check("target pos + vec3 works", (tp + math.vec3(0, 0, 0)) ~= nil)
        else
            print("[Vec3Test] SKIP: no target entity provided")
        end

        -- 12. Vec3 property auto-hydration: offset should be a proper Vec3
        local offset = self.properties.offset
        check("offset property is non-nil", offset ~= nil)
        if offset then
            check("offset has .x", offset.x ~= nil)
            check("offset has .y", offset.y ~= nil)
            check("offset has .z", offset.z ~= nil)
            check("offset.x == 1", offset.x == 1)
            check("offset.y == 2", offset.y == 2)
            check("offset.z == 3", offset.z == 3)
            local oClone = offset:clone()
            check("offset:clone() works", oClone ~= nil)
            local oSum = offset + math.vec3(10, 10, 10)
            check("offset + vec3 works", oSum ~= nil and oSum.x == 11)
        end

        if self.state.passed then
            print("[Vec3Test] ALL PASSED")
        else
            print("[Vec3Test] SOME TESTS FAILED")
        end
    end
}
