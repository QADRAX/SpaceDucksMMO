import type { Position, Position3D, Vector3 } from '../types/vector';

/**
 * Utilidades para proyectar entre coordenadas locales 3D y coordenadas galácticas 2D.
 *
 * Simplificación asumida: el plano galáctico es global y común a todos los sistemas.
 * Por defecto el plano es z-up (normal = { x: 0, y: 0, z: 1 }).
 */

/**
 * Proyecta una posición local 3D a coordenadas galácticas 2D.
 * - localPos: posición en el sistema (3D)
 * - systemLocalPosition: posición fija del sistema en el espacio local (3D)
 * - galaxyPlaneNormal: vector normal del plano galáctico; si no se provee se asume Z arriba.
 *
 * Implementación simple: si el plano es Z-up, la proyección es (x + system.x, y + system.y).
 */
export function projectLocalToGalactic2D(
  localPos: Position3D,
  systemLocalPosition: Position3D,
  galaxyPlaneNormal?: Vector3
): Position {
  // si el plano no es Z, podríamos rotar la coordenada; asumimos Z-up para simplificar
  const normal = galaxyPlaneNormal ?? { x: 0, y: 0, z: 1 };
  // Si el normal no es Z-up, no hacemos rotación compleja aquí — dejamos la simple aproximación.
  if (Math.abs(normal.x) < 1e-6 && Math.abs(normal.y) < 1e-6 && Math.abs(normal.z - 1) < 1e-6) {
    return {
      x: localPos.x + systemLocalPosition.x,
      y: localPos.y + systemLocalPosition.y
    };
  }

  // Rotación simplificada: proyectamos descartando la componente a lo largo de la normal.
  // Esto es una aproximación; para casos serios implementar una rotación completa.
  const x = localPos.x + systemLocalPosition.x;
  const y = localPos.y + systemLocalPosition.y;
  return { x, y };
}

/**
 * Reconstruye una posición local 3D aproximada a partir de una posición galáctica 2D
 * y la posición local fija del sistema.
 * - devuelto z = systemLocalPosition.z (se conserva la altitud del sistema)
 */
export function projectGalactic2DToLocal(
  galacticPos: Position,
  systemLocalPosition: Position3D,
  galaxyPlaneNormal?: Vector3
): Position3D {
  const normal = galaxyPlaneNormal ?? { x: 0, y: 0, z: 1 };
  // Asunción Z-up: invertimos la suma usada en la proyección
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
