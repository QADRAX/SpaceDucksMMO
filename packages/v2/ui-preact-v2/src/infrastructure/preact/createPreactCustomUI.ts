import type { EntityId, UICustomRuntimePort, ViewportId } from '@duckengine/core-v2';
import { h, render, type ComponentType } from 'preact';
import { applyUiRootLayout } from './duckDocument';

type MountKey = `${EntityId}::${ViewportId}`;

function mountKey(entityId: EntityId, viewportId: ViewportId): MountKey {
  return `${entityId}::${viewportId}`;
}

/** Props injected into a consumer Preact custom UI. */
export interface PreactCustomUIProps {
  readonly entityId: EntityId;
  readonly sceneId: string;
  readonly viewportId: ViewportId;
  readonly props: Readonly<Record<string, unknown>>;
  readonly emit: (eventName: string, payload?: unknown) => void;
}

/** Registration entry for a Preact custom UI. */
export interface PreactCustomUIRegistration {
  /** Resource key (e.g. `spas/inventory`). */
  readonly entry: string;
  /** Preact component that receives {@link PreactCustomUIProps}. */
  readonly component: ComponentType<PreactCustomUIProps>;
}

/**
 * Builds a {@link UICustomRuntimePort} that mounts registered Preact components
 * for `uiCustom` roots. Easy formula for game/tool authors:
 *
 * ```ts
 * const customRuntime = createPreactCustomUI([
 *   { entry: 'spas/inventory', component: InventoryApp },
 * ]);
 * ```
 */
export function createPreactCustomUI(
  registrations: ReadonlyArray<PreactCustomUIRegistration>,
): UICustomRuntimePort {
  const byEntry = new Map<string, ComponentType<PreactCustomUIProps>>();
  for (const reg of registrations) {
    byEntry.set(String(reg.entry), reg.component);
  }

  const roots = new Map<MountKey, HTMLElement>();
  const propListeners = new Map<MountKey, Set<(p: Readonly<Record<string, unknown>>) => void>>();
  const lastProps = new Map<MountKey, Readonly<Record<string, unknown>>>();
  const lastEmit = new Map<MountKey, (eventName: string, payload?: unknown) => void>();
  const lastMeta = new Map<
    MountKey,
    { entityId: EntityId; sceneId: string; viewportId: ViewportId; Component: ComponentType<PreactCustomUIProps> }
  >();

  const paint = (key: MountKey, root: HTMLElement) => {
    const meta = lastMeta.get(key);
    if (!meta) return;
    const props = lastProps.get(key) ?? {};
    const emit = lastEmit.get(key) ?? (() => undefined);
    const vnode = h(meta.Component, {
      entityId: meta.entityId,
      sceneId: meta.sceneId,
      viewportId: meta.viewportId,
      props,
      emit,
    });
    render(vnode, root);
  };

  return {
    mount(params) {
      const host = params.surface.hostRef;
      if (!(host instanceof HTMLElement)) return;

      const Component = byEntry.get(String(params.spa.key));
      if (!Component) return;

      const key = mountKey(params.entityId, params.viewportId);
      let root = roots.get(key);
      if (!root) {
        root = document.createElement('div');
        root.dataset.duckUiCustom = params.entityId;
        host.appendChild(root);
        roots.set(key, root);
      }

      const listeners = new Set<(p: Readonly<Record<string, unknown>>) => void>();
      propListeners.set(key, listeners);
      lastProps.set(key, params.context.props);
      lastEmit.set(key, params.context.emit);
      lastMeta.set(key, {
        entityId: params.entityId,
        sceneId: String(params.sceneId),
        viewportId: params.viewportId,
        Component,
      });

      params.context.onProps((next) => {
        lastProps.set(key, next);
        for (const l of listeners) l(next);
        paint(key, root!);
      });

      applyUiRootLayout(root, params.layout);
      paint(key, root);
    },

    update(params) {
      const key = mountKey(params.entityId, params.viewportId);
      const root = roots.get(key);
      if (!root) return;
      if (params.layout) applyUiRootLayout(root, params.layout);
      if (params.props) {
        lastProps.set(key, params.props);
        const listeners = propListeners.get(key);
        if (listeners) for (const l of listeners) l(params.props);
      }
      paint(key, root);
    },

    unmount(entityId, viewportId) {
      const key = mountKey(entityId, viewportId);
      const root = roots.get(key);
      if (!root) return;
      render(null, root);
      root.remove();
      roots.delete(key);
      propListeners.delete(key);
      lastProps.delete(key);
      lastEmit.delete(key);
      lastMeta.delete(key);
    },
  };
}
