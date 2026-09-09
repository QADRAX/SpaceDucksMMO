import type {
  EntityId,
  UIViewMountParams,
  UIViewRuntimePort,
  UIViewUpdateParams,
  ViewportId,
  UiNode,
} from '@duckengine/core-v2';
import { isResourceRef } from '@duckengine/core-v2';
import { applyUiRootLayout, renderUiNodeTree } from './renderUiNodeTree';

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
 * Minimal DOM Duck UI runtime (default kit: column/row/panel/text/button/progress).
 */
export function createDomUIViewRuntime(): UIViewRuntimePort {
  const roots = new Map<MountKey, HTMLElement>();
  const lastDoc = new Map<MountKey, UiNode | null>();
  const lastBindings = new Map<MountKey, Readonly<Record<string, unknown>>>();

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
      applyUiRootLayout(root, params.layout);
      renderUiNodeTree(root, doc, params.bindings);
    },

    update(params: UIViewUpdateParams) {
      const key = mountKey(params.entityId, params.viewportId);
      const root = roots.get(key);
      if (!root) return;

      if (params.layout) applyUiRootLayout(root, params.layout);

      const doc =
        params.document !== undefined
          ? resolveDocument(params.document)
          : (lastDoc.get(key) ?? null);
      const bindings = params.bindings ?? lastBindings.get(key) ?? {};
      if (params.document !== undefined) lastDoc.set(key, doc);
      if (params.bindings !== undefined) lastBindings.set(key, bindings);

      if (params.document !== undefined || params.bindings !== undefined) {
        renderUiNodeTree(root, doc, bindings);
      }
    },

    unmount(entityId: EntityId, viewportId: ViewportId) {
      const key = mountKey(entityId, viewportId);
      const root = roots.get(key);
      if (!root) return;
      root.remove();
      roots.delete(key);
      lastDoc.delete(key);
      lastBindings.delete(key);
    },
  };
}
