/**
 * Sphere geometry generation for WebGPU
 * Creates vertex data with positions, normals, and UV coordinates
 */

export interface SphereGeometry {
  vertices: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  indexCount: number;
}

/**
 * Creates a UV sphere with specified parameters
 * @param radius Sphere radius
 * @param widthSegments Number of horizontal segments
 * @param heightSegments Number of vertical segments
 * @returns Sphere geometry data with interleaved vertex attributes
 */
export function createSphere(
  radius: number,
  widthSegments: number,
  heightSegments: number
): SphereGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  // Generate vertices
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;

      // Position
      const px = -radius * Math.cos(theta) * Math.sin(phi);
      const py = radius * Math.cos(phi);
      const pz = radius * Math.sin(theta) * Math.sin(phi);

      // Normal (normalized position for a sphere centered at origin)
      const nx = px / radius;
      const ny = py / radius;
      const nz = pz / radius;

      // UV coordinates
      const uvU = u;
      const uvV = v;

      // Interleaved: position(3) + normal(3) + uv(2) = 8 floats per vertex
      vertices.push(px, py, pz, nx, ny, nz, uvU, uvV);
    }
  }

  // Generate indices
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;

      // Two triangles per quad
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    vertexCount: vertices.length / 8, // 8 floats per vertex
    indexCount: indices.length,
  };
}
