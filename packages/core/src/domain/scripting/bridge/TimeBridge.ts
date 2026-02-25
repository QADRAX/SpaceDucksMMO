import type { LuaEngine } from "wasmoon";

export function registerTimeBridge(engine: LuaEngine) {
    let currentDt = 0;

    const timeApi = {
        getDelta: () => currentDt,
        getTime: () => Date.now() / 1000
    };
    engine.global.set("time", timeApi);

    return {
        setDelta: (dt: number) => { currentDt = dt; }
    };
}
