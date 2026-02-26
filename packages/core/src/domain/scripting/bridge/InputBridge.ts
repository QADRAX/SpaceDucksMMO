import type { LuaEngine } from "wasmoon";
import { Entity, getInputServices } from "../../ecs";

export function registerInputBridge(engine: LuaEngine) {
    const inputApi = {
        isKeyPressed: (key: string) => {
            return getInputServices().keyboard.isKeyPressed(key);
        },
        getMouseDelta: () => {
            const m = getInputServices().mouse.getState();
            return { x: m.deltaX, y: m.deltaY };
        },
        getMouseButtons: () => {
            const m = getInputServices().mouse.getState();
            return { left: m.buttons.left, right: m.buttons.right, middle: m.buttons.middle };
        },
        requestPointerLock: () => {
            getInputServices().mouse.requestPointerLock();
        },
        exitPointerLock: () => {
            getInputServices().mouse.exitPointerLock();
        }
    };
    engine.global.set("input", inputApi);
}
