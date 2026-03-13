export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface EulerLike {
  x: number;
  y: number;
  z: number;
}

export interface QuatLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

export function vec3(x = 0, y = 0, z = 0): Vec3Like {
  return { x, y, z };
}

export function euler(x = 0, y = 0, z = 0): EulerLike {
  return { x, y, z };
}

export function quat(x = 0, y = 0, z = 0, w = 1): QuatLike {
  return { x, y, z, w };
}

export default {} as any;
