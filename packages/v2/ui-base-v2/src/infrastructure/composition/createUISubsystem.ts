import { createSceneSubsystem } from '@duckengine/core-v2';
import type { CreateUISubsystemStateOptions } from '../../domain/uiSubsystem/createUISubsystemState';
import { createUISubsystemState } from '../../domain/uiSubsystem/createUISubsystemState';
import type { UISubsystemState } from '../../domain/uiSubsystem/types';
import { reconcileUiRoots } from '../../application/reconcileUiRoots';
import { unmountAllUiRoots } from '../../application/unmountAllUiRoots';

/**
 * Scene subsystem: projects ECS UI roots (`transform2d` + `uiView`|`uiSpa`) onto
 * host surfaces via {@link UISurfaceHostPort}, {@link UIViewRuntimePort}, and
 * {@link UISpaRuntimePort}.
 *
 * Events and `lateUpdate` share {@link reconcileUiRoots}; teardown uses
 * {@link unmountAllUiRoots}.
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
