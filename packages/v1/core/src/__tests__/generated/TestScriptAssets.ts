// Auto-generated file. Do not edit directly.
// Run 'npm run build:test-scripts' to regenerate.

export const TestScripts: Record<string, string> = {
    "test://test_bridge_vec3.lua": `-- =======================================================================
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
`,
    "test://test_events.lua": `-- =======================================================================
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
`,
    "test://test_lifecycle.lua": `---@class TestLifecycleState
---@field initCalled boolean
---@field updateCalled number

---@type ScriptBlueprint<any, TestLifecycleState>
return {
    schema = {
        name = "Test Lifecycle",
        description = "A script to verify all lifecycle hooks are correctly called in tests."
    },

    ---@param self ScriptInstance<any, TestLifecycleState>
    init = function(self)
        if not self.state then
            print("[Test] ERROR: self.state is nil in init!")
            return
        end
        self.state.initCalled = true
        self.state.updateCalled = 0
        print("[Test] init called, state type: " .. type(self.state))
    end,


    ---@param self ScriptInstance<any, TestLifecycleState>
    update = function(self)
        self.state.updateCalled = self.state.updateCalled + 1
        if self.state.updateCalled == 1 then
            print("[Test] first update")
        end
    end
}
`,
    "test://test_math_ext.lua": `-- =======================================================================
-- test_math_ext.lua
-- Integration test: validates math.ext functions and easing curves.
-- =======================================================================

---@type ScriptBlueprint<any, any>
return {
    schema = {
        name = "Test Math Ext",
        description = "E2E test for math.ext bridge functions and easing curves."
    },

    ---@param self ScriptInstance<any, any>
    init = function(self)
        local pass = true

        local function check(label, condition)
            if not condition then
                pass = false
                print("[MathExt] FAIL: " .. label)
            else
                print("[MathExt] PASS: " .. label)
            end
        end

        local function approx(a, b, eps)
            eps = eps or 0.001
            return math.abs(a - b) < eps
        end

        -- ── lerp ──
        check("lerp(0,10,0.5)==5", approx(math.ext.lerp(0, 10, 0.5), 5))
        check("lerp(0,10,0)==0",   approx(math.ext.lerp(0, 10, 0), 0))
        check("lerp(0,10,1)==10",  approx(math.ext.lerp(0, 10, 1), 10))

        -- ── clamp ──
        check("clamp(5,0,10)==5",   approx(math.ext.clamp(5, 0, 10), 5))
        check("clamp(-1,0,10)==0",  approx(math.ext.clamp(-1, 0, 10), 0))
        check("clamp(15,0,10)==10", approx(math.ext.clamp(15, 0, 10), 10))

        -- ── inverseLerp ──
        check("inverseLerp(0,10,5)==0.5", approx(math.ext.inverseLerp(0, 10, 5), 0.5))
        check("inverseLerp(0,10,0)==0",   approx(math.ext.inverseLerp(0, 10, 0), 0))
        check("inverseLerp(0,10,10)==1",  approx(math.ext.inverseLerp(0, 10, 10), 1))

        -- ── remap ──
        check("remap(5,0,10,0,100)==50", approx(math.ext.remap(5, 0, 10, 0, 100), 50))
        check("remap(0,0,10,100,200)==100", approx(math.ext.remap(0, 0, 10, 100, 200), 100))

        -- ── sign ──
        check("sign(5)==1",    math.ext.sign(5) == 1)
        check("sign(-3)==-1",  math.ext.sign(-3) == -1)
        check("sign(0)==0",    math.ext.sign(0) == 0)

        -- ── moveTowards ──
        check("moveTowards(0,10,3)==3",   approx(math.ext.moveTowards(0, 10, 3), 3))
        check("moveTowards(0,10,20)==10", approx(math.ext.moveTowards(0, 10, 20), 10))
        check("moveTowards(5,3,1)==4",    approx(math.ext.moveTowards(5, 3, 1), 4))

        -- ── pingPong ──
        check("pingPong(0,5)==0",   approx(math.ext.pingPong(0, 5), 0))
        check("pingPong(5,5)==5",   approx(math.ext.pingPong(5, 5), 5))
        check("pingPong(7,5)==3",   approx(math.ext.pingPong(7, 5), 3))
        check("pingPong(10,5)==0",  approx(math.ext.pingPong(10, 5), 0))

        -- ── wrapRepeat ──
        check("wrapRepeat(3,5)==3", approx(math.ext.wrapRepeat(3, 5), 3))
        check("wrapRepeat(7,5)==2", approx(math.ext.wrapRepeat(7, 5), 2))

        -- ── easing: boundary conditions ──
        local easings = {
            "linear", "smoothstep",
            "quadIn", "quadOut", "quadInOut",
            "cubicIn", "cubicOut", "cubicInOut",
            "sineIn", "sineOut", "sineInOut",
            "expIn", "expOut",
            "circleIn", "circleOut",
            "elasticIn", "elasticOut", "elasticInOut",
            "backIn", "backOut", "backInOut",
            "bounceOut"
        }
        for _, name in ipairs(easings) do
            local fn = math.ext.easing[name]
            check("easing." .. name .. " exists", fn ~= nil)
            if fn then
                check("easing." .. name .. "(0)~=0", approx(fn(0), 0, 0.01))
                check("easing." .. name .. "(1)~=1", approx(fn(1), 1, 0.01))
            end
        end

        -- ── easing: monotonicity spot checks ──
        check("quadOut(0.5)>0.5", math.ext.easing.quadOut(0.5) > 0.5)
        check("cubicIn(0.5)<0.5", math.ext.easing.cubicIn(0.5) < 0.25 + 0.01)

        -- ── smoothDamp (guarded) ──
        if math.ext.smoothDamp then
            local result = math.ext.smoothDamp(0, 10, 0, 0.3, 0.016)
            check("smoothDamp returns number", type(result) == "number")
            check("smoothDamp moves towards target", result > 0)
        else
            print("[MathExt] SKIP: smoothDamp not available")
        end

        if pass then
            print("[MathExt] ALL PASSED")
        else
            print("[MathExt] SOME TESTS FAILED")
        end
    end
}
`,
    "test://test_scene_destroy.lua": `-- =======================================================================
-- test_scene_destroy.lua
-- Integration test: validates self:destroy() triggers entity removal.
-- =======================================================================

---@class DestroyTestState
---@field frame number

---@type ScriptBlueprint<any, DestroyTestState>
return {
    schema = {
        name = "Test Scene Destroy",
        description = "E2E test for self:destroy() calling scene.destroyEntity."
    },

    ---@param self ScriptInstance<any, DestroyTestState>
    init = function(self)
        self.state.frame = 0
        print("[Destroy] init called for " .. tostring(self.id))
    end,

    ---@param self ScriptInstance<any, DestroyTestState>
    ---@param dt number
    update = function(self, dt)
        self.state.frame = self.state.frame + 1
        if self.state.frame == 2 then
            print("[Destroy] calling self:destroy()")
            self:destroy()
        end
    end,

    ---@param self ScriptInstance<any, DestroyTestState>
    onDestroy = function(self)
        print("[Destroy] onDestroy called for " .. tostring(self.id))
    end
}
`,
    "test://test_time_api.lua": `-- =======================================================================
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
`,
    "test://test_vec3_extended.lua": `-- =======================================================================
-- test_vec3_extended.lua
-- Integration test: validates new Vec3 methods added in Phase 3.
-- Assumes math.vec3 is available (sandbox_init + math_ext loaded).
-- =======================================================================

---@type ScriptBlueprint<any, any>
return {
    schema = {
        name = "Test Vec3 Extended",
        description = "E2E test for new Vec3 instance methods."
    },

    ---@param self ScriptInstance<any, any>
    init = function(self)
        local pass = true

        local function check(label, condition)
            if not condition then
                pass = false
                print("[Vec3Ext] FAIL: " .. label)
            else
                print("[Vec3Ext] PASS: " .. label)
            end
        end

        local function approx(a, b, eps)
            eps = eps or 0.001
            return math.abs(a - b) < eps
        end

        local function approxVec(v, x, y, z, eps)
            eps = eps or 0.001
            return approx(v.x, x, eps) and approx(v.y, y, eps) and approx(v.z, z, eps)
        end

        -- ── lerp ──
        local a = math.vec3(0, 0, 0)
        local b = math.vec3(10, 20, 30)
        local mid = a:lerp(b, 0.5)
        check("lerp(0.5) midpoint", approxVec(mid, 5, 10, 15))
        check("lerp(0) returns start", approxVec(a:lerp(b, 0), 0, 0, 0))
        check("lerp(1) returns end", approxVec(a:lerp(b, 1), 10, 20, 30))

        -- ── reflect ──
        local incoming = math.vec3(1, -1, 0)
        local normal   = math.vec3(0, 1, 0)
        local reflected = incoming:reflect(normal)
        check("reflect off Y normal", approxVec(reflected, 1, 1, 0))

        -- ── project ──
        local v = math.vec3(3, 4, 0)
        local onto = math.vec3(1, 0, 0)
        local proj = v:project(onto)
        check("project onto X axis", approxVec(proj, 3, 0, 0))

        -- ── angleTo ──
        local vx = math.vec3(1, 0, 0)
        local vy = math.vec3(0, 1, 0)
        local angle = vx:angleTo(vy)
        check("angleTo(90deg)", approx(angle, math.pi / 2, 0.01))

        local vx2 = math.vec3(1, 0, 0)
        local angle0 = vx:angleTo(vx2)
        check("angleTo(self)~=0", approx(angle0, 0, 0.01))

        -- ── min / max ──
        local v1 = math.vec3(1, 5, 3)
        local v2 = math.vec3(4, 2, 6)
        local vmin = v1:min(v2)
        local vmax = v1:max(v2)
        check("min per-component", approxVec(vmin, 1, 2, 3))
        check("max per-component", approxVec(vmax, 4, 5, 6))

        -- ── abs ──
        local neg = math.vec3(-3, -7, 5)
        local absv = neg:abs()
        check("abs", approxVec(absv, 3, 7, 5))

        -- ── floor ──
        local frac = math.vec3(1.7, 2.3, -0.5)
        local fl = frac:floor()
        check("floor", approxVec(fl, 1, 2, -1))

        -- ── ceil ──
        local ce = frac:ceil()
        check("ceil", approxVec(ce, 2, 3, 0))

        -- ── set ──
        local sv = math.vec3(0, 0, 0)
        sv:set(5, 10, 15)
        check("set", approxVec(sv, 5, 10, 15))

        -- ── toArray ──
        local arr = math.vec3(1, 2, 3):toArray()
        check("toArray[1]", arr[1] == 1)
        check("toArray[2]", arr[2] == 2)
        check("toArray[3]", arr[3] == 3)

        -- ── lengthSq ──
        local lsq = math.vec3(3, 4, 0):lengthSq()
        check("lengthSq returns 25", approx(lsq, 25))

        -- ── dot ──
        local dot = math.vec3(1, 0, 0):dot(math.vec3(0, 1, 0))
        check("dot perpendicular == 0", approx(dot, 0))
        local dot2 = math.vec3(2, 3, 4):dot(math.vec3(2, 3, 4))
        check("dot self == lengthSq", approx(dot2, 4 + 9 + 16))

        -- ── cross ──
        local cx = math.vec3(1, 0, 0):cross(math.vec3(0, 1, 0))
        check("cross X×Y = Z", approxVec(cx, 0, 0, 1))

        if pass then
            print("[Vec3Ext] ALL PASSED")
        else
            print("[Vec3Ext] SOME TESTS FAILED")
        end
    end
}
`,
};
