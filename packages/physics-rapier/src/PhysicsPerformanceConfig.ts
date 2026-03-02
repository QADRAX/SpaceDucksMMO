/**
 * Enhanced physics performance configurations for Rapier
 * Enables fine-tuning of solver, damping, and LOD for high-load scenarios
 */

import type { Vec3Like } from "@duckengine/core";

/**
 * Physics performance optimization modes
 * Choose based on your use case
 */
export enum PhysicsOptimizationMode {
  /**
   * Default stable mode
   * - Solver iterations: 4
   * - Good stability, moderate performance
   */
  STABLE = "stable",

  /**
   * Balanced mode for dynamic scenes
   * - Solver iterations: 3
   * - Good balance between performance and stability
   */
  BALANCED = "balanced",

  /**
   * High-performance mode for many bodies
   * - Solver iterations: 2
   * - Less precision but 50% faster
   */
  PERFORMANCE = "performance",

  /**
   * Extreme mode for massively parallel scenes
   * - Solver iterations: 1
   * - Fastest but reduced stability
   * - Only for simple scenarios (falling objects, non-stacked)
   */
  EXTREME = "extreme",
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
   * Can be updated each frame: physics.setLODCenter(cameraPos)
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
 * Extended physics timestep configuration
 * Combines standard config with performance tuning
 */
export interface ExtendedPhysicsTimestepConfig {
  /** Standard timestep settings */
  fixedStepSeconds?: number;
  maxSubSteps?: number;

  /** Optimization mode shortcut */
  optimizationMode?: PhysicsOptimizationMode;

  /** Detailed solver configuration */
  solver?: Partial<PhysicsSolverConfig>;

  /** Distance-based LOD configuration */
  lod?: Partial<PhysicsLODConfig>;
}

/**
 * Convert optimization mode to specific solver iterations
 */
export function getModeIterations(mode: PhysicsOptimizationMode): number {
  switch (mode) {
    case PhysicsOptimizationMode.STABLE:
      return 4;
    case PhysicsOptimizationMode.BALANCED:
      return 3;
    case PhysicsOptimizationMode.PERFORMANCE:
      return 2;
    case PhysicsOptimizationMode.EXTREME:
      return 1;
    default:
      return 4;
  }
}

/**
 * Get recommended solver config for a scenario
 */
export function getSolverConfigForScenario(scenario: 
  | "stable"        // Default, very stable (4 iterations)
  | "balanced"      // Mid-tier (3 iterations)
  | "stacks"        // For stacked structures with damping (2 iterations, high damping)
  | "chaos"         // For falling objects (2 iterations)
  | "extreme"       // Maximum performance (1 iteration)
): PhysicsSolverConfig {
  switch (scenario) {
    case "stable":
      return {
        iterations: 4,
        defaultLinearDamping: 0.0,
        defaultAngularDamping: 0.0,
        autoSleep: true,
        sleepVelocityThreshold: 0.01,
        sleepTimeThreshold: 0.5,
      };

    case "balanced":
      return {
        iterations: 3,
        defaultLinearDamping: 0.1,
        defaultAngularDamping: 0.1,
        autoSleep: true,
        sleepVelocityThreshold: 0.05,
        sleepTimeThreshold: 0.3,
      };

    case "stacks":
      return {
        iterations: 2,
        defaultLinearDamping: 0.5,  // High damping helps stacks settle
        defaultAngularDamping: 0.5,
        autoSleep: true,
        sleepVelocityThreshold: 0.05,
        sleepTimeThreshold: 0.2,
      };

    case "chaos":
      return {
        iterations: 2,
        defaultLinearDamping: 0.2,
        defaultAngularDamping: 0.2,
        autoSleep: true,
        sleepVelocityThreshold: 0.01,
        sleepTimeThreshold: 0.5,
      };

    case "extreme":
      return {
        iterations: 1,
        defaultLinearDamping: 0.5,
        defaultAngularDamping: 0.5,
        autoSleep: true,
        sleepVelocityThreshold: 0.1,  // More aggressive sleeping
        sleepTimeThreshold: 0.1,
      };
  }
}

/**
 * Default LOD configuration for typical games
 */
export const DEFAULT_LOD_CONFIG: PhysicsLODConfig = {
  enabled: false,
  fullPrecisionDistance: 50,
  reducedPrecisionDistance: 100,
  cullingDistance: 200,
  reducedTimestepMultiplier: 0.5,
};

/**
 * Default solver configuration (stable)
 */
export const DEFAULT_SOLVER_CONFIG: PhysicsSolverConfig = {
  iterations: 4,
  defaultLinearDamping: 0.0,
  defaultAngularDamping: 0.0,
  autoSleep: true,
  sleepVelocityThreshold: 0.01,
  sleepTimeThreshold: 0.5,
};
