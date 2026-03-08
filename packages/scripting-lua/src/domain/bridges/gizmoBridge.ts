import type { Color, SceneState, ScriptSchema } from '@duckengine/core-v2';
import type { BridgeDeclaration } from './types';

/** Gizmo bridge — debug drawing proxied to the renderer's gizmo port. */
export const gizmoBridge: BridgeDeclaration = {
  name: 'Gizmo',
  perEntity: false,
  factory(_scene: SceneState, _entityId: string, _schema: ScriptSchema | null, ports) {
    return {
      drawLine(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }, color?: Color) {
        ports.gizmo?.drawLine(from, to, color);
      },
      drawSphere(center: { x: number; y: number; z: number }, radius: number, color?: Color) {
        ports.gizmo?.drawSphere(center, radius, color);
      },
      drawBox(center: { x: number; y: number; z: number }, size: { x: number; y: number; z: number }, color?: Color) {
        ports.gizmo?.drawBox(center, size, color);
      },
      drawLabel(text: string, position: { x: number; y: number; z: number }, color?: Color) {
        ports.gizmo?.drawLabel(text, position, color);
      },
      clear() {
        ports.gizmo?.clear();
      },
    };
  },
};
