/**
 * Vector en 2D para posiciones galácticas o viajes intergalácticos.
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Vector en 3D para posiciones locales (sistemas, órbitas, etc).
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Posición en 2D para navegación galáctica.
 */
export interface Position extends Vector2 {}

/**
 * Posición en 3D para simulación local (sistemas, órbitas, planetas).
 */
export interface Position3D extends Vector3 {}

/**
 * Velocidad en 2D.
 */
export interface Velocity extends Vector2 {}

/**
 * Velocidad en 3D.
 */
export interface Velocity3D extends Vector3 {}
