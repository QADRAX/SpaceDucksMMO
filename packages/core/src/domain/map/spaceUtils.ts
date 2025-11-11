import type { Position, Position3D, Vector3 } from '../types/vector';

export function projectLocalToGalactic2D(
  localPos: Position3D,
  systemLocalPosition: Position3D,
  galaxyPlaneNormal?: Vector3
): Position {
  const normal = galaxyPlaneNormal ?? { x: 0, y: 0, z: 1 };
  if (Math.abs(normal.x) < 1e-6 && Math.abs(normal.y) < 1e-6 && Math.abs(normal.z - 1) < 1e-6) {
    return {
      x: localPos.x + systemLocalPosition.x,
      y: localPos.y + systemLocalPosition.y
    };
  }
  const x = localPos.x + systemLocalPosition.x;
  const y = localPos.y + systemLocalPosition.y;
  return { x, y };
}

export function projectGalactic2DToLocal(
  galacticPos: Position,
  systemLocalPosition: Position3D,
  galaxyPlaneNormal?: Vector3
): Position3D {
  const normal = galaxyPlaneNormal ?? { x: 0, y: 0, z: 1 };
  if (Math.abs(normal.x) < 1e-6 && Math.abs(normal.y) < 1e-6 && Math.abs(normal.z - 1) < 1e-6) {
    return {
      x: galacticPos.x - systemLocalPosition.x,
      y: galacticPos.y - systemLocalPosition.y,
      z: systemLocalPosition.z
    };
  }
  return {
    x: galacticPos.x - systemLocalPosition.x,
    y: galacticPos.y - systemLocalPosition.y,
    z: systemLocalPosition.z
  };
}
