import type { LuaEngine } from "wasmoon";
import { SystemScripts } from "../generated/ScriptAssets";

/**
 * Exposes mathematical utilities and easing functions to the Lua environment.
 */
export function registerMathBridge(engine: LuaEngine) {
    const mathApi = {
        lerp: (a: number, b: number, t: number) => a + (b - a) * t,
        clamp: (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),

        easing: {
            // Basic
            linear: (t: number) => t,
            smoothstep: (t: number) => t * t * (3 - 2 * t),

            // Quadratic
            quadIn: (t: number) => t * t,
            quadOut: (t: number) => t * (2 - t),
            quadInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

            // Cubic
            cubicIn: (t: number) => t * t * t,
            cubicOut: (t: number) => { const t1 = t - 1; return t1 * t1 * t1 + 1; },
            cubicInOut: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

            // Sine
            sineIn: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
            sineOut: (t: number) => Math.sin((t * Math.PI) / 2),
            sineInOut: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

            // Exponential
            expIn: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
            expOut: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

            // Circle
            circleIn: (t: number) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
            circleOut: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),

            // Bounce
            bounceOut: (t: number) => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            }
        }
    };

    engine.global.set("math_ext", mathApi);
    // Shortcut for ease of use in Lua
    engine.doStringSync(SystemScripts["math_ext.lua"]);
}
