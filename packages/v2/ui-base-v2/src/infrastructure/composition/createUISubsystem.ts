import { createSceneSubsystem } from '@duckengine/core-v2';
import type { CreateUISubsystemStateOptions } from '../../domain/uiSubsystem/createUISubsystemState';
import { createUISubsystemState } from '../../domain/uiSubsystem/createUISubsystemState';
import type { UISubsystemState } from '../../domain/uiSubsystem/types';
import { reconcileUiRoots } from '../../application/reconcileUiRoots';
import { unmountAllUiRoots } from '../../application/unmountAllUiRoots';

/**
 * Shared scene UI subsystem: projects ECS roots (`transform2d` + `uiView`|`uiCustom`)
 * onto surfaces, then **delegates** to {@link UIViewRuntimePort} (Duck) or
 * {@link UICustomRuntimePort} (custom).
 */
export function createUISubsystem(options?: CreateUISubsystemStateOptions) {
  return createSceneSubsystem<UISubsystemState>({
    id: 'ui',
    createState: (ctx) => createUISubsystemState(ctx, options),
    events: {
      'scene-setup': reconcileUiRoots,
      'scene-teardown': unmountAllUiRoots,
      'entity-added': reconcileUiRoots,
      'entity-removed': reconcileUiRoots,
      'component-changed': reconcileUiRoots,
      'hierarchy-changed': reconcileUiRoots,
    },
    phases: {
      lateUpdate: reconcileUiRoots,
    },
  });
}
