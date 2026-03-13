export type RapierModule = typeof import("@dimforge/rapier3d-compat");

let rapier: RapierModule | null = null;

/**
 * Initialize Rapier WASM module once. Call this during app bootstrap.
 * After this resolves, `getRapier()` becomes available synchronously.
 */
export async function initRapier(): Promise<RapierModule> {
  if (rapier) return rapier;
  // Dynamic import works better across bundlers/Node/Electron.
  const mod = (await import("@dimforge/rapier3d-compat")) as unknown as RapierModule & {
    default?: RapierModule;
  };
  const R = (mod as any)?.default ?? mod;
  if (typeof R?.init === "function") await R.init();
  rapier = R as RapierModule;
  return rapier;
}

export function getRapier(): RapierModule {
  if (!rapier)
    throw new Error(
      "Rapier not initialized. Call initRapier() during bootstrap before creating RapierPhysicsSystem."
    );
  return rapier;
}
