type RapierModule = typeof import("@dimforge/rapier3d-compat");

let rapier: any | null = null;

/**
 * Initialize Rapier WASM module once. Call this during app bootstrap.
 * After this resolves, `getRapier()` becomes available synchronously.
 */
export async function initRapier(): Promise<any> {
  if (rapier) return rapier;
  // Dynamic import works better across bundlers/Node/Electron.
  const mod: any = await import("@dimforge/rapier3d-compat");
  const R = mod?.default ?? mod;
  if (typeof R?.init === "function") await R.init();
  rapier = R;
  return rapier;
}

export function getRapier(): any {
  if (!rapier)
    throw new Error(
      "Rapier not initialized. Call initRapier() during bootstrap before creating RapierPhysicsSystem."
    );
  return rapier;
}
