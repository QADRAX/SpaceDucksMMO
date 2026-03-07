import type { Vec3Like } from './math';

/** Fixed-timestep settings for a physics simulation. */
export interface PhysicsTimestepConfig {
  /** Fixed step in seconds. Default: 1/60. */
  fixedStepSeconds?: number;
  /** Max substeps per frame to avoid spiral-of-death. Default: 5. */
  maxSubSteps?: number;
}

/** A ray cast into the physics world. */
export interface PhysicsRay {
  origin: Vec3Like;
  direction: Vec3Like;
  maxDistance?: number;
}

/** Result of a physics raycast test. */
export interface PhysicsRaycastHit {
  entityId: string;
  point: Vec3Like;
  normal: Vec3Like;
  distance: number;
}

/** Kind of collision event between two physics bodies. */
export type PhysicsCollisionEventKind = 'enter' | 'stay' | 'exit';

/** Raw collision event dispatched by the physics system. */
export interface PhysicsCollisionEvent {
  kind: PhysicsCollisionEventKind;
  /** Entity id of the first rigid-body owner. */
  a: string;
  /** Entity id of the second rigid-body owner. */
  b: string;
  /** Collider entity id for side A (if per-collider granularity). */
  colliderA?: string;
  /** Collider entity id for side B (if per-collider granularity). */
  colliderB?: string;
}

/** Real-time performance statistics from the physics simulation. */
export interface PhysicsPerformanceStats {
  /** Total rigid bodies in the simulation. */
  totalBodies: number;
  /** Active (awake) rigid bodies currently being simulated. */
  activeBodies: number;
  /** Total colliders in the simulation. */
  totalColliders: number;
  /** Current constraint solver iterations per frame. */
  solverIterations: number;
}

/** Solver configuration for constraint resolution. */
export interface PhysicsSolverConfig {
  /** Sequential impulse solver iterations per step. Higher = more stable, slower. */
  iterations: number;
  /** Linear damping applied to all bodies. Range: 0.0–1.0. */
  defaultLinearDamping: number;
  /** Angular damping applied to all bodies. Range: 0.0–1.0. */
  defaultAngularDamping: number;
  /** Enable automatic sleeping of bodies at rest. */
  autoSleep: boolean;
  /** Velocity threshold for auto-sleep (m/s). */
  sleepVelocityThreshold: number;
  /** Inactivity duration before sleep (seconds). */
  sleepTimeThreshold: number;
}

/** Distance-based physics Level of Detail configuration. */
export interface PhysicsLODConfig {
  /** Enable distance-based physics LOD. */
  enabled: boolean;
  /** Distance within which bodies use full precision. */
  fullPrecisionDistance: number;
  /** Distance within which bodies use reduced timestep. */
  reducedPrecisionDistance: number;
  /** Distance beyond which bodies are disabled entirely. */
  cullingDistance: number;
  /** Reference point for distance calculations (usually the camera). */
  lodCenter?: Vec3Like;
  /** Timestep multiplier for reduced-precision bodies. Default: 0.5. */
  reducedTimestepMultiplier: number;
}

/** A complete physics performance profile grouping solver and LOD settings. */
export interface PhysicsPerformanceProfile {
  /** Unique identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of when to use this profile. */
  description?: string;
  /** Solver configuration. */
  solver: PhysicsSolverConfig;
  /** Level-of-Detail configuration. */
  lod: PhysicsLODConfig;
}

/** Extended timestep configuration with optional performance profile. */
export interface ExtendedPhysicsTimestepConfig {
  fixedStepSeconds?: number;
  maxSubSteps?: number;
  performanceProfile?: PhysicsPerformanceProfile;
}

/** Named optimization modes mapping to predefined profiles. */
export type PhysicsOptimizationMode = 'stable' | 'balanced' | 'performance' | 'extreme';

/** Converts an optimization mode to its corresponding profile id. */
export function modeToProfileId(mode: PhysicsOptimizationMode): string {
  return `profile.${mode}`;
}

/** Helper to create a custom performance profile. */
export function createPerformanceProfile(
  id: string,
  name: string,
  solver: PhysicsSolverConfig,
  lod: PhysicsLODConfig,
  description?: string,
): PhysicsPerformanceProfile {
  return { id, name, description, solver, lod };
}
