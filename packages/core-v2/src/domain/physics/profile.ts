import type { PhysicsOptimizationMode, PhysicsPerformanceProfile, PhysicsSolverConfig, PhysicsLODConfig } from './types';

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
