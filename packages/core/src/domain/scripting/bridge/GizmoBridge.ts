import type { LuaEngine } from "wasmoon";
import type { BridgeContext } from "./BridgeContext";

export function registerGizmoBridge(engine: LuaEngine, ctx: BridgeContext) {
    const gizmoApi = {
        drawLine: (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color?: string) => {
            if (ctx.gizmoRenderer) {
                ctx.gizmoRenderer.drawLine(x1, y1, z1, x2, y2, z2, color);
            }
        },
        drawSphere: (x: number, y: number, z: number, radius: number, color?: string) => {
            if (ctx.gizmoRenderer) {
                ctx.gizmoRenderer.drawSphere(x, y, z, radius, color);
            }
        },
        drawBox: (x: number, y: number, z: number, w: number, h: number, d: number, color?: string) => {
            if (ctx.gizmoRenderer) {
                ctx.gizmoRenderer.drawBox(x, y, z, w, h, d, color);
            }
        }
    };
    engine.global.set("gizmos", gizmoApi);
}
