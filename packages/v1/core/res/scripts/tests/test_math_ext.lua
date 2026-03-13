-- =======================================================================
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
