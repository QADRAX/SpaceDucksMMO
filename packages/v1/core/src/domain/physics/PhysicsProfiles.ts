/**
 * Predefined Physics Performance Profiles
 * 
 * Ready-to-use optimization profiles for common scenarios.
 * These are defined in the core to be implementation-agnostic,
 * but can be loaded from external config files in the future.
 */

import type { IPhysicsPerformanceProfile } from "./PhysicsPerformanceProfile";
import { PhysicsOptimizationMode } from "./PhysicsPerformanceProfile";

/**
 * Default LOD configuration for typical games
 */
const DEFAULT_LOD_CONFIG = {
  enabled: false,
  fullPrecisionDistance: 50,
  reducedPrecisionDistance: 100,
  cullingDistance: 200,
  reducedTimestepMultiplier: 0.5,
};

/**
 * STABLE profile
 * Default, very stable physics
 * - 4 solver iterations
 * - No damping
 * - Auto-sleep enabled
 * 
 * Best for: General gameplay, puzzle games, exploration
 */
export const PROFILE_STABLE: IPhysicsPerformanceProfile = {
  id: `profile.${PhysicsOptimizationMode.STABLE}`,
  name: "Stable",
  description: "Default stable mode - good for most games",
  solver: {
    iterations: 4,
    defaultLinearDamping: 0.0,
    defaultAngularDamping: 0.0,
    autoSleep: true,
    sleepVelocityThreshold: 0.01,
    sleepTimeThreshold: 0.5,
  },
  lod: DEFAULT_LOD_CONFIG,
};

/**
 * BALANCED profile
 * Good balance between performance and stability
 * - 3 solver iterations
 * - Slight damping (0.1)
 * - Auto-sleep with moderate threshold
 * 
 * Best for: Dynamic gameplay, moderate physics loads
 */
export const PROFILE_BALANCED: IPhysicsPerformanceProfile = {
  id: `profile.${PhysicsOptimizationMode.BALANCED}`,
  name: "Balanced",
  description: "Good balance between performance and stability",
  solver: {
    iterations: 3,
    defaultLinearDamping: 0.1,
    defaultAngularDamping: 0.1,
    autoSleep: true,
    sleepVelocityThreshold: 0.05,
    sleepTimeThreshold: 0.3,
  },
  lod: DEFAULT_LOD_CONFIG,
};

/**
 * PERFORMANCE profile
 * High-performance mode for many bodies
 * - 2 solver iterations (50% faster)
 * - Moderate damping (0.2)
 * - Aggressive auto-sleep
 * 
 * Best for: High-load scenes, many falling objects, debris
 */
export const PROFILE_PERFORMANCE: IPhysicsPerformanceProfile = {
  id: `profile.${PhysicsOptimizationMode.PERFORMANCE}`,
  name: "Performance",
  description: "High-performance mode - 50% faster, reduced precision",
  solver: {
    iterations: 2,
    defaultLinearDamping: 0.2,
    defaultAngularDamping: 0.2,
    autoSleep: true,
    sleepVelocityThreshold: 0.01,
    sleepTimeThreshold: 0.5,
  },
  lod: DEFAULT_LOD_CONFIG,
};

/**
 * STACKED profile
 * Optimized for stacked structures (pyramids, boxes)
 * - 2 solver iterations
 * - High damping (0.5) to settle quickly
 * - Very aggressive auto-sleep
 * 
 * Best for: Puzzle games with stacked objects, block structures
 */
export const PROFILE_STACKED: IPhysicsPerformanceProfile = {
  id: "profile.stacked",
  name: "Stacked",
  description: "Optimized for stacked structures - high damping for fast settling",
  solver: {
    iterations: 2,
    defaultLinearDamping: 0.5,   // High damping helps stacks settle
    defaultAngularDamping: 0.5,
    autoSleep: true,
    sleepVelocityThreshold: 0.05,
    sleepTimeThreshold: 0.2,
  },
  lod: DEFAULT_LOD_CONFIG,
};

/**
 * EXTREME profile
 * Maximum performance at the cost of stability
 * - 1 solver iteration
 * - High damping (0.5)
 * - Very aggressive auto-sleep (0.1 m/s threshold)
 * 
 * Best for: Massively parallel scenes, fallback for low-end devices
 * WARNING: Only use for simple scenarios (falling objects, non-stacked)
 */
export const PROFILE_EXTREME: IPhysicsPerformanceProfile = {
  id: `profile.${PhysicsOptimizationMode.EXTREME}`,
  name: "Extreme",
  description: "Maximum performance - 1 iteration, only for simple scenarios",
  solver: {
    iterations: 1,
    defaultLinearDamping: 0.5,
    defaultAngularDamping: 0.5,
    autoSleep: true,
    sleepVelocityThreshold: 0.1,  // More aggressive sleeping
    sleepTimeThreshold: 0.1,
  },
  lod: DEFAULT_LOD_CONFIG,
};

/**
 * OPEN_WORLD profile
 * Optimized for large open-world scenes with physics LOD
 * - 2 solver iterations
 * - Moderate damping (0.2)
 * - Physics LOD enabled (50m full, 100m reduced, 200m culled)
 * 
 * Best for: Open-world games, large environments
 */
export const PROFILE_OPEN_WORLD: IPhysicsPerformanceProfile = {
  id: "profile.open_world",
  name: "Open World",
  description: "Optimized for large worlds with physics LOD",
  solver: {
    iterations: 2,
    defaultLinearDamping: 0.2,
    defaultAngularDamping: 0.2,
    autoSleep: true,
    sleepVelocityThreshold: 0.01,
    sleepTimeThreshold: 0.5,
  },
  lod: {
    enabled: true,
    fullPrecisionDistance: 50,
    reducedPrecisionDistance: 100,
    cullingDistance: 200,
    reducedTimestepMultiplier: 0.5,
  },
};

/**
 * All predefined profiles
 * Useful for discovery and validation
 */
export const PREDEFINED_PROFILES: Record<string, IPhysicsPerformanceProfile> = {
  [PROFILE_STABLE.id]: PROFILE_STABLE,
  [PROFILE_BALANCED.id]: PROFILE_BALANCED,
  [PROFILE_PERFORMANCE.id]: PROFILE_PERFORMANCE,
  [PROFILE_STACKED.id]: PROFILE_STACKED,
  [PROFILE_EXTREME.id]: PROFILE_EXTREME,
  [PROFILE_OPEN_WORLD.id]: PROFILE_OPEN_WORLD,
};

/**
 * Get a predefined profile by ID
 * Returns null if not found (allowing custom profiles)
 */
export function getPredefinedProfile(
  id: string
): IPhysicsPerformanceProfile | null {
  return PREDEFINED_PROFILES[id] ?? null;
}

/**
 * Get a predefined profile by optimization mode
 */
export function getProfileByMode(
  mode: PhysicsOptimizationMode
): IPhysicsPerformanceProfile {
  const id = `profile.${mode}`;
  const profile = PREDEFINED_PROFILES[id];
  if (!profile) {
    throw new Error(`Unknown optimization mode: ${mode}`);
  }
  return profile;
}
