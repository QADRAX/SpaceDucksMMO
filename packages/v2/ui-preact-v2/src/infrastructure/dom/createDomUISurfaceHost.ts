import type { UISurfaceHandle, UISurfaceHostPort, ViewportId } from '@duckengine/core-v2';

/**
 * Mutable DOM surface host: maps viewport ids to overlay HTMLElements.
 * Call {@link DomUISurfaceHost.attachOverlay} when a viewport/canvas is ready.
 */
export interface DomUISurfaceHost extends UISurfaceHostPort {
  /**
   * Creates (or returns) an absolutely-positioned overlay inside `parent`
   * and registers it for `viewportId`.
   */
  attachOverlay(viewportId: ViewportId, parent: HTMLElement): HTMLElement;
  /** Removes the overlay element and unregisters the surface. */
  detachOverlay(viewportId: ViewportId): void;
  /** Registers an existing element as the surface (no DOM creation). */
  setSurface(viewportId: ViewportId, element: HTMLElement): void;
}

/**
 * Creates a web DOM implementation of {@link UISurfaceHostPort}.
 */
export function createDomUISurfaceHost(): DomUISurfaceHost {
  const surfaces = new Map<ViewportId, HTMLElement>();

  return {
    getSurface(viewportId: ViewportId): UISurfaceHandle | undefined {
      const el = surfaces.get(viewportId);
      if (!el) return undefined;
      return { viewportId, hostRef: el };
    },

    setSurface(viewportId, element) {
      surfaces.set(viewportId, element);
    },

    attachOverlay(viewportId, parent) {
      const existing = surfaces.get(viewportId);
      if (existing) return existing;

      const parentStyle = getComputedStyle(parent);
      if (parentStyle.position === 'static') {
        parent.style.position = 'relative';
      }

      const overlay = document.createElement('div');
      overlay.dataset.duckUiOverlay = String(viewportId);
      overlay.style.position = 'absolute';
      overlay.style.inset = '0';
      overlay.style.overflow = 'hidden';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '10';
      parent.appendChild(overlay);
      surfaces.set(viewportId, overlay);
      return overlay;
    },

    detachOverlay(viewportId) {
      const el = surfaces.get(viewportId);
      if (!el) return;
      el.remove();
      surfaces.delete(viewportId);
    },
  };
}
