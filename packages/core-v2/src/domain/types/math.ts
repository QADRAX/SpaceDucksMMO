/** 3D vector with x, y, z components. */
export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

/** Euler rotation angles in radians (YXZ order). */
export interface EulerLike {
  x: number;
  y: number;
  z: number;
}

/** Quaternion rotation with x, y, z, w components. */
export interface QuatLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Creates a Vec3Like with the given components. Defaults to origin (0,0,0). */
export function vec3(x = 0, y = 0, z = 0): Vec3Like {
  return { x, y, z };
}

/** Creates an EulerLike with the given angles in radians. Defaults to (0,0,0). */
export function euler(x = 0, y = 0, z = 0): EulerLike {
  return { x, y, z };
}

/** Creates a QuatLike. Defaults to identity quaternion (0,0,0,1). */
export function quat(x = 0, y = 0, z = 0, w = 1): QuatLike {
  return { x, y, z, w };
}
