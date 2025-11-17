import type { DevWidget } from './DevWidget';

export class DevRegistry {
  private widgets = new Map<string, DevWidget>();

  register(widget: DevWidget): () => void {
    this.widgets.set(widget.id, widget);
    if (widget.mount) widget.mount();
    return () => {
      const w = this.widgets.get(widget.id);
      if (w && w.unmount) w.unmount();
      this.widgets.delete(widget.id);
    };
  }

  getWidgets(): DevWidget[] {
    return Array.from(this.widgets.values());
  }
}

export default DevRegistry;
