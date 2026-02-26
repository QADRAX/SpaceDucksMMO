import type { LuaEngine } from "wasmoon";
import type { BridgeContext } from "./BridgeContext";

const isVec3 = (v: any): boolean => v !== null && typeof v === 'object' && 'x' in v;

export function registerGizmoBridge(engine: LuaEngine, ctx: BridgeContext) {
    const gizmoApi = {
        drawLine: (startPos: any, endPos: any, color?: string) => {
            if (!ctx.gizmoRenderer) return;
            if (startPos && endPos) {
                ctx.gizmoRenderer.drawLine(startPos.x, startPos.y, startPos.z, endPos.x, endPos.y, endPos.z, color);
            }
        },
        drawSphere: (center: any, radius: number, color?: string) => {
            if (!ctx.gizmoRenderer) return;
            if (center) {
                ctx.gizmoRenderer.drawSphere(center.x, center.y, center.z, radius, color);
            }
        },
        drawBox: (center: any, w: number, h: number, d: number, color?: string) => {
            if (!ctx.gizmoRenderer) return;
            if (center) {
                ctx.gizmoRenderer.drawBox(center.x, center.y, center.z, w, h, d, color);
            }
        },
        drawLabel: (text: string, position: any, color?: string) => {
            if (!ctx.gizmoRenderer) return;
            if (position) {
                ctx.gizmoRenderer.drawLabel(text, position.x, position.y, position.z, color);
            }
        },
        drawGrid: (size: number, divisions: number, color?: string) => {
            if (ctx.gizmoRenderer) {
                ctx.gizmoRenderer.drawGrid(size, divisions, color);
            }
        },
        drawFrustum: (fov: number, aspect: number, near: number, far: number, position: any, rotation: any, color?: string) => {
            if (!ctx.gizmoRenderer) return;
            if (position && rotation) {
                ctx.gizmoRenderer.drawFrustum(fov, aspect, near, far, position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, color);
            }
        }
    };
    engine.global.set("gizmos", gizmoApi);
}
