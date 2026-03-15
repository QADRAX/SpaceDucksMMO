import type { Color, ScriptSchema } from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts } from './types';

/** Gizmo bridge — debug drawing proxied to the renderer's gizmo port. */
export const gizmoBridge: BridgeDeclaration = {
  name: 'Gizmo',
  perEntity: false,
  factory(_scene, _entityId, _schema: ScriptSchema | null, ports: BridgePorts) {
    const drawer = () => ports.getGizmo?.() ?? ports.gizmo;
    return {
      drawLine(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }, color?: Color) {
        drawer()?.drawLine(from, to, color);
      },
      drawSphere(center: { x: number; y: number; z: number }, radius: number, color?: Color) {
        drawer()?.drawSphere(center, radius, color);
      },
      drawBox(center: { x: number; y: number; z: number }, size: { x: number; y: number; z: number }, color?: Color) {
        drawer()?.drawBox(center, size, color);
      },
      drawLabel(text: string, position: { x: number; y: number; z: number }, color?: Color) {
        drawer()?.drawLabel(text, position, color);
      },
      drawGrid(size: number, divisions: number, color?: Color) {
        const d = drawer();
        if (d && 'drawGrid' in d) d.drawGrid(size, divisions, color);
      },
      clear() {
        drawer()?.clear();
      },
    };
  },
};
