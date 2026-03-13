/**
 * Physics Performance Profiles
 * 
 * Defines reusable configurations for physics simulation optimization.
 * Profiles can be:
 * - Predefined (STABLE, PERFORMANCE, etc)
 * - Loaded from config files (future: JSON, YAML)
 * - Generated dynamically based on scene analysis
 * - Created at runtime by developers
 */

import type { Vec3Like } from "../ecs";

/**
 * Solver configuration for constraint resolution
 */
export interface PhysicsSolverConfig {
  /**
   * Number of sequential impulse solver iterations per step
   * Higher = more stable but slower
   * - 1: Extremely fast, very unstable
   * - 2: Fast, reduced stability (useful for stacks)
   * - 3: Balanced
   * - 4: Default, very stable
   * - 5+: Overkill for most scenarios
   */
  iterations: number;

  /**
   * Linear damping applied to all bodies by default
   * Simulates air resistance / friction
   * Range: 0.0 (no damping) to 1.0 (strong damping)
   * Default: 0.0
   *
   * Useful for stacks: 0.3-0.5 makes them settle faster
   */
  defaultLinearDamping: number;

  /**
   * Angular damping applied to all bodies by default
   * Simulates rotational friction
   * Range: 0.0 to 1.0
   * Default: 0.0
   *
   * Useful for stacks: 0.3-0.5 stabilizes rotation
   */
  defaultAngularDamping: number;

  /**
   * Enable automatic sleeping of bodies at rest
   * Bodies that move slower than sleepVelocityThreshold are put to sleep
   * Sleeping bodies cost 0 CPU
   * They wake up when hit or activated
   * Default: true
   */
  autoSleep: boolean;

  /**
   * Velocity threshold for auto-sleep (m/s)
   * Bodies slower than this can be put to sleep
   * Default: 0.01 (very slow)
   */
  sleepVelocityThreshold: number;

  /**
   * Time of inactivity before sleep (seconds)
   * Bodies inactive for this duration are put to sleep
   * Default: 0.5
   */
  sleepTimeThreshold: number;
}

/**
 * Physics Level of Detail (LOD) configuration
 * Culls distant bodies to save CPU
 */
export interface PhysicsLODConfig {
  /**
   * Enable distance-based physics LOD
   * Default: false
   */
  enabled: boolean;

  /**
   * Distance at which bodies are fully simulated
   * Bodies closer than this use full precision
   * Default: 50 meters
   */
  fullPrecisionDistance: number;

  /**
   * Distance at which bodies are reduced-precision simulated
   * Bodies between fullPrecisionDistance and this distance use reduced timestep
   * Default: 100 meters
   */
  reducedPrecisionDistance: number;

  /**
   * Distance beyond which bodies are disabled
   * Bodies farther than this are not simulated at all
   * They wake up when camera gets close
   * Default: 200 meters
   */
  cullingDistance: number;

  /**
   * The reference point for distance calculations
   * Usually the camera position
   * Updated each frame based on active viewport
   */
  lodCenter?: Vec3Like;

  /**
   * Timestep multiplier for reduced-precision bodies
   * 0.5 = half timestep = half precision but half CPU
   * Default: 0.5
   */
  reducedTimestepMultiplier: number;
}

/**
 * A complete physics performance profile
 * Groups solver and LOD settings together
 * Can be applied atomically to a physics system
 */
export interface IPhysicsPerformanceProfile {
  /** Unique identifier for this profile */
  id: string;

  /** Human-readable name */
  name: string;

  /** Optional description of when to use this profile */
  description?: string;

  /** Solver configuration */
  solver: PhysicsSolverConfig;

  /** Level-of-Detail configuration */
  lod: PhysicsLODConfig;
}

/**
 * Extended physics timestep configuration
 * Combines standard config with performance profile
 */
export interface ExtendedPhysicsTimestepConfig {
  /** Standard timestep settings */
  fixedStepSeconds?: number;
  maxSubSteps?: number;

  /** Performance profile to apply */
  performanceProfile?: IPhysicsPerformanceProfile;
}

/**
 * Physics optimization mode enum for convenience
 * Used to select predefined profiles
 */
export enum PhysicsOptimizationMode {
  STABLE = "stable",
  BALANCED = "balanced",
  PERFORMANCE = "performance",
  EXTREME = "extreme",
}

/**
 * Convert optimization mode to profile ID
 */
export function modeToProfileId(mode: PhysicsOptimizationMode): string {
  return `profile.${mode}`;
}

/**
 * Helper to create a custom performance profile
 */
export function createPerformanceProfile(
  id: string,
  name: string,
  solver: PhysicsSolverConfig,
  lod: PhysicsLODConfig,
  description?: string
): IPhysicsPerformanceProfile {
  return {
    id,
    name,
    description,
    solver,
    lod,
  };
}
