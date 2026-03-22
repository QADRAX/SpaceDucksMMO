/**
 * @file Supported engine resource kinds
 *
 * Returns the list of `ResourceKind` values this package build can persist and resolve.
 * Values come from domain configuration (`getSupportedResourceKinds`), not from the database.
 *
 * @see `listSupportedResourceKindsUseCase` — use case object
 * @see `listSupportedResourceKinds` — synchronous helper (same data, no DI)
 */
import { defineResourceUseCase } from '../../domain/useCases';
import { getSupportedResourceKinds } from '../../domain/supportedResourceKinds';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';

/**
 * Use case: supported resource kinds (static list for this build).
 */
export const listSupportedResourceKindsUseCase = defineResourceUseCase<
  ResourcePersistenceUseCaseDeps,
  undefined,
  readonly string[]
>({
  name: 'listSupportedResourceKinds',
  async run(_deps, _input) {
    void _deps;
    void _input;
    return getSupportedResourceKinds();
  },
});

/** Same kind list as the use case, without async/DI (convenience for callers that only need the array). */
export function listSupportedResourceKinds(): readonly string[] {
  return getSupportedResourceKinds();
}
