import type { EntityState, Transform2dComponent, UIRootLayout } from '@duckengine/core-v2';

/**
 * Builds a surface layout box from an active `transform2d` component.
 * Rect uses normalized viewport space (0–1).
 */
export function layoutFromTransform2d(t: Transform2dComponent): UIRootLayout {
  return {
    rect: {
      x: t.localPosition.x,
      y: t.localPosition.y,
      w: t.localSize.x * t.localScale.x,
      h: t.localSize.y * t.localScale.y,
    },
    zIndex: t.zIndex,
    rotation: t.localRotation,
  };
}

/**
 * True when the entity is an active UI content root (pose + enabled content).
 */
export function isActiveUiContentRoot(entity: EntityState): boolean {
  const hasView = entity.components.get('uiView')?.enabled !== false && entity.components.has('uiView');
  const hasSpa = entity.components.get('uiSpa')?.enabled !== false && entity.components.has('uiSpa');
  const t = entity.components.get('transform2d');
  const poseActive = !!t && t.enabled !== false;
  return poseActive && (hasView || hasSpa);
}
