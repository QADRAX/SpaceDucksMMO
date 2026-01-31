/**
 * Matrix utilities for 3D transformations using gl-matrix
 */

import { mat4 } from 'gl-matrix';

/**
 * Creates a combined Model-View-Projection matrix using gl-matrix
 */
export function createMVPMatrix(rotation: number): Float32Array {
  const projection = mat4.create();
  const view = mat4.create();
  const model = mat4.create();
  const mvp = mat4.create();

  // Perspective projection
  mat4.perspective(projection, Math.PI / 4, 1.0, 0.1, 100.0);

  // View matrix: camera at (0, 0, 3) looking at origin
  mat4.lookAt(view, [0, 0, 3], [0, 0, 0], [0, 1, 0]);

  // Model matrix: rotation around Y axis
  mat4.rotateY(model, model, rotation);

  // Combine: MVP = projection * view * model
  mat4.multiply(mvp, view, model);
  mat4.multiply(mvp, projection, mvp);

  return mvp as Float32Array;
}
