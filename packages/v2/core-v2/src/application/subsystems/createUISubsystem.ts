import type { EngineState } from '../../domain/engine';
import type { SceneSubsystemFactory, SubsystemEventParams } from '../../domain/subsystems';
import {
  defineSceneSubsystem,
  defineSubsystemEventUseCase,
} from '../../domain/subsystems';
import {
  UIRendererPortDef,
  ViewportOverlayProviderPortDef,
} from '../../domain/ports';
import type { UIRendererPort, ViewportOverlayProviderPort } from '../../domain/ports';
import { createUISlotView } from '../../domain/ui';
import type { ViewportId } from '../../domain/ids';

interface UISubsystemState {
  engine: EngineState;
  uiRenderer: UIRendererPort | undefined;
  viewportOverlayProvider: ViewportOverlayProviderPort | undefined;
}

/**
 * Creates a SceneSubsystemFactory that reacts to UI slot events and delegates
 * mount/unmount to UIRendererPort. Requires UIRendererPort and optionally
 * ViewportOverlayProviderPort in the registry.
 */
export function createUISubsystem(): SceneSubsystemFactory {
  return defineSceneSubsystem<UISubsystemState, { uiRenderer: UIRendererPort | undefined; viewportOverlayProvider: ViewportOverlayProviderPort | undefined }>('ui')
    .withPorts((registry) => ({
      uiRenderer: registry.get(UIRendererPortDef),
      viewportOverlayProvider: registry.get(ViewportOverlayProviderPortDef),
    }))
    .withState(({ ports, engine }) => ({
      engine,
      uiRenderer: ports.uiRenderer,
      viewportOverlayProvider: ports.viewportOverlayProvider,
    }))
    .onEvent(
      defineSubsystemEventUseCase<UISubsystemState, SubsystemEventParams>({
        name: 'ui/handleSlotAdded',
        event: 'ui-slot-added',
        execute(state, { scene, event }) {
          if (event.kind !== 'ui-slot-added' || !state.uiRenderer) return;

          const slot = scene.uiSlots.get(event.slotId);
          if (!slot || !slot.enabled) return;

          const viewports = Array.from(state.engine.viewports.values()).filter(
            (vp) => vp.sceneId === scene.id && vp.enabled,
          );

          const targetViewports =
            slot.viewportId === null
              ? viewports
              : viewports.filter((vp) => vp.id === slot.viewportId);

          const slotView = createUISlotView(slot);

          for (const vp of targetViewports) {
            const container = state.viewportOverlayProvider?.getOverlayContainer(
              vp.id as ViewportId,
            );
            if (container) {
              state.uiRenderer.mount(slotView, container);
            }
          }

          if (targetViewports.length === 0 && state.viewportOverlayProvider && viewports[0]) {
            const container = state.viewportOverlayProvider.getOverlayContainer(
              viewports[0].id as ViewportId,
            );
            if (container) state.uiRenderer.mount(slotView, container);
          }
        },
      }),
    )
    .onEvent(
      defineSubsystemEventUseCase<UISubsystemState, SubsystemEventParams>({
        name: 'ui/handleSlotRemoved',
        event: 'ui-slot-removed',
        execute(state, { event }) {
          if (event.kind !== 'ui-slot-removed' || !state.uiRenderer) return;
          state.uiRenderer.unmount(event.slotId);
        },
      }),
    )
    .onEvent(
      defineSubsystemEventUseCase<UISubsystemState, SubsystemEventParams>({
        name: 'ui/handleSlotUpdated',
        event: 'ui-slot-updated',
        execute(state, { scene, event }) {
          if (event.kind !== 'ui-slot-updated' || !state.uiRenderer?.updateSlot) return;

          const slot = scene.uiSlots.get(event.slotId);
          if (!slot) return;

          state.uiRenderer.updateSlot(event.slotId, createUISlotView(slot));
        },
      }),
    )
    .onEvent(
      defineSubsystemEventUseCase<UISubsystemState, SubsystemEventParams>({
        name: 'ui/handleTeardown',
        event: 'scene-teardown',
        execute(state, { scene }) {
          if (!state.uiRenderer) return;
          for (const slotId of scene.uiSlots.keys()) {
            state.uiRenderer.unmount(slotId);
          }
        },
      }),
    )
    .build();
}
