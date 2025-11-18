import type { DevWidget } from './DevWidget';

export class DevRegistry {
  private widgets = new Map<string, DevWidget>();
  private mounted = new Set<string>();

  /**
   * Register a widget in the registry. Registration does not mount the widget.
   * Returns an unregister function that will unmount (if mounted) and remove the widget.
   */
  register(widget: DevWidget): () => void {
    this.widgets.set(widget.id, widget);
    return () => {
      this.unmountWidget(widget.id);
      this.widgets.delete(widget.id);
    };
  }

  /**
   * Get only mounted widgets for rendering in overlays.
   */
  getWidgets(): DevWidget[] {
    return Array.from(this.mounted).map((id) => this.widgets.get(id)!).filter(Boolean);
  }

  /** Mount a registered widget by id (no-op if already mounted). */
  mountWidget(id: string): void {
    const w = this.widgets.get(id);
    if (!w) return;
    if (!this.mounted.has(id)) {
      this.mounted.add(id);
      if (w.mount) w.mount();
    }
  }

  /** Unmount a mounted widget by id (no-op if not mounted). */
  unmountWidget(id: string): void {
    const w = this.widgets.get(id);
    if (!w) return;
    if (this.mounted.has(id)) {
      if (w.unmount) w.unmount();
      this.mounted.delete(id);
    }
  }

  /** Toggle mount state for a widget; returns true when mounted after toggle. */
  toggleWidget(id: string): boolean {
    if (this.mounted.has(id)) {
      this.unmountWidget(id);
      return false;
    }
    this.mountWidget(id);
    return true;
  }

  /** Check if a widget is currently mounted. */
  isWidgetMounted(id: string): boolean {
    return this.mounted.has(id);
  }
}

export default DevRegistry;
