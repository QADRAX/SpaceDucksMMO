import type { Vec3Like, Color } from '../../math';

/**
 * Contract for imperative debug gizmo drawing.
 * Implementations live in renderer backends.
 */
export interface GizmoPort {
  /** Draw a line between two 3D points. */
  drawLine(from: Vec3Like, to: Vec3Like, color?: Color): void;
  /** Draw a wireframe sphere. */
  drawSphere(center: Vec3Like, radius: number, color?: Color): void;
  /** Draw a wireframe box centered at `center` with the given half-extents. */
  drawBox(center: Vec3Like, size: Vec3Like, color?: Color): void;
  /** Draw a text label in 3D space. */
  drawLabel(text: string, position: Vec3Like, color?: Color): void;
  /** Draw a ground grid. */
  drawGrid(size: number, divisions: number, color?: Color): void;
  /** Clear all gizmos from the previous frame. */
  clear(): void;
}
