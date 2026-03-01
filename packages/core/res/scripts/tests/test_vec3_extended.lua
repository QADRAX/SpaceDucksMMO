-- =======================================================================
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
