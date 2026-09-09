import type { EntityId, SceneId, ViewportId } from '../ids';
import type { UiTarget } from './uiTarget';

/** Minimal viewport fields needed to resolve {@link UiTarget}. */
export interface UiTargetViewportCandidate {
  readonly id: ViewportId;
  readonly sceneId: SceneId;
  readonly cameraEntityId: EntityId;
  readonly enabled: boolean;
}

/** Options for {@link resolveUiTargetViewports}. */
export interface ResolveUiTargetViewportsParams {
  readonly sceneId: SceneId;
  readonly target: UiTarget | null | undefined;
  readonly viewports: ReadonlyArray<UiTargetViewportCandidate>;
  /**
   * Returns true when the camera entity has the given tag.
   * Required when `target.cameraTags` is non-empty; otherwise unused.
   */
  readonly cameraHasTag?: (cameraEntityId: EntityId, tag: string) => boolean;
}

/**
 * Resolves which viewports a UI root should paint on (§3.6).
 * Empty filter lists → all enabled viewports of `sceneId`.
 * Non-empty groups are OR'd across groups; tags/ids within a list are OR'd.
 */
export function resolveUiTargetViewports(
  params: ResolveUiTargetViewportsParams,
): ViewportId[] {
  const { sceneId, target, viewports, cameraHasTag } = params;
  const candidates = viewports.filter((vp) => vp.enabled && vp.sceneId === sceneId);

  const viewportIds = target?.viewportIds ?? [];
  const cameraIds = target?.cameraIds ?? [];
  const cameraTags = target?.cameraTags ?? [];
  const hasFilter =
    viewportIds.length > 0 || cameraIds.length > 0 || cameraTags.length > 0;

  if (!hasFilter) {
    return candidates.map((vp) => vp.id);
  }

  const viewportIdSet = new Set(viewportIds);
  const cameraIdSet = new Set(cameraIds);

  return candidates
    .filter((vp) => {
      if (viewportIdSet.has(vp.id)) return true;
      if (cameraIdSet.has(vp.cameraEntityId)) return true;
      if (cameraTags.length > 0 && cameraHasTag) {
        for (const tag of cameraTags) {
          if (cameraHasTag(vp.cameraEntityId, tag)) return true;
        }
      }
      return false;
    })
    .map((vp) => vp.id);
}
