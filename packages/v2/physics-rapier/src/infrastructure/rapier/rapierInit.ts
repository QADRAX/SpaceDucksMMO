export type RapierModule = typeof import('@dimforge/rapier3d-compat');

let rapier: RapierModule | null = null;

/**
 * Initialize Rapier WASM module once. Call during app bootstrap before creating physics.
 */
export async function initRapier(): Promise<RapierModule> {
  if (rapier) return rapier;
  const mod = (await import('@dimforge/rapier3d-compat')) as unknown as RapierModule & {
    default?: RapierModule;
  };
  const R = mod?.default ?? mod;
  if (typeof (R as RapierModule & { init?: () => Promise<void> }).init === 'function') {
    await (R as RapierModule & { init: () => Promise<void> }).init();
  }
  rapier = R as RapierModule;
  return rapier;
}

/**
 * Returns the initialized Rapier module. Throws if initRapier() was not called first.
 */
export function getRapier(): RapierModule {
  if (!rapier) {
    throw new Error(
      'Rapier not initialized. Call initRapier() during bootstrap before creating physics.'
    );
  }
  return rapier;
}
