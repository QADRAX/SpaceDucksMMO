import type { SceneId } from '../../ids';
import type { GizmoPort } from './gizmoPort';

/**
 * Provides a scene-scoped GizmoPort for debug drawing.
 * Implemented by the rendering subsystem.
 */
export interface GizmoPortProvider {
  /** Returns a GizmoPort that draws into the given scene. */
  getDrawer(sceneId: SceneId): GizmoPort | undefined;
}
