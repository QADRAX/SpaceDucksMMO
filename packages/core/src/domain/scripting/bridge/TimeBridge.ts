import type { LuaEngine } from "wasmoon";

export function registerTimeBridge(engine: LuaEngine) {
    let currentDt = 0;
    let elapsed = 0;
    let frameCount = 0;
    let scale = 1;

    const timeApi = {
        getDelta: () => currentDt * scale,
        getUnscaledDelta: () => currentDt,
        getElapsed: () => elapsed,
        getFrameCount: () => frameCount,
        getScale: () => scale,
        setScale: (s: number) => { scale = Math.max(0, s); },
        getTime: () => Date.now() / 1000,
        now: () => Date.now() / 1000
    };

    engine.global.set("Time", timeApi);
    engine.global.set("time", timeApi);

    return {
        setDelta: (dt: number) => {
            currentDt = dt;
            elapsed += dt * scale;
            frameCount++;
        },
        getScale: () => scale
    };
}
