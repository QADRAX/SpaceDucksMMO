import type {
  EntityId,
  UIViewMountParams,
  UIViewRuntimePort,
  UIViewUpdateParams,
  ViewportId,
  UiNode,
} from '@duckengine/core-v2';
import { isResourceRef } from '@duckengine/core-v2';
import { h, render } from 'preact';
import { applyUiRootLayout, DuckDocument } from './duckDocument';

type MountKey = `${EntityId}::${ViewportId}`;

function mountKey(entityId: EntityId, viewportId: ViewportId): MountKey {
  return `${entityId}::${viewportId}`;
}

function resolveDocument(document: UIViewMountParams['document']): UiNode | null {
  if (!document) return null;
  if (isResourceRef(document)) {
    return {
      type: 'text',
      props: { text: `[uiDocument:${document.key}]` },
    };
  }
  return document;
}

/**
 * Duck UI view runtime backed by Preact (default kit).
 */
export function createPreactUIViewRuntime(): UIViewRuntimePort {
  const roots = new Map<MountKey, HTMLElement>();
  const lastDoc = new Map<MountKey, UiNode | null>();
  const lastBindings = new Map<MountKey, Readonly<Record<string, unknown>>>();
  const lastOnEvent = new Map<MountKey, UIViewMountParams['onEvent']>();

  const paint = (key: MountKey, root: HTMLElement) => {
    const doc = lastDoc.get(key) ?? null;
    const bindings = lastBindings.get(key) ?? {};
    const onEvent = lastOnEvent.get(key);
    render(
      h(DuckDocument, {
        node: doc,
        bindings,
        onEvent: onEvent
          ? (e) => {
              const [entityId, viewportId] = key.split('::') as [EntityId, ViewportId];
              onEvent({ entityId, viewportId, ...e });
            }
          : undefined,
      }),
      root,
    );
  };

  return {
    mount(params: UIViewMountParams) {
      const host = params.surface.hostRef;
      if (!(host instanceof HTMLElement)) return;

      const key = mountKey(params.entityId, params.viewportId);
      let root = roots.get(key);
      if (!root) {
        root = document.createElement('div');
        root.dataset.duckUiRoot = params.entityId;
        host.appendChild(root);
        roots.set(key, root);
      }

      const doc = resolveDocument(params.document);
      lastDoc.set(key, doc);
      lastBindings.set(key, params.bindings);
      lastOnEvent.set(key, params.onEvent);
      applyUiRootLayout(root, params.layout);
      paint(key, root);
    },

    update(params: UIViewUpdateParams) {
      const key = mountKey(params.entityId, params.viewportId);
      const root = roots.get(key);
      if (!root) return;

      if (params.layout) applyUiRootLayout(root, params.layout);

      if (params.document !== undefined) {
        lastDoc.set(key, resolveDocument(params.document));
      }
      if (params.bindings !== undefined) {
        lastBindings.set(key, params.bindings);
      }

      if (params.document !== undefined || params.bindings !== undefined || params.layout) {
        paint(key, root);
      }
    },

    unmount(entityId: EntityId, viewportId: ViewportId) {
      const key = mountKey(entityId, viewportId);
      const root = roots.get(key);
      if (!root) return;
      render(null, root);
      root.remove();
      roots.delete(key);
      lastDoc.delete(key);
      lastBindings.delete(key);
      lastOnEvent.delete(key);
    },
  };
}
