import type IScreen from '../../domain/ports/IScreen';
import ScreenId from '../../domain/ui/ScreenId';

export class ScreenRouter {
  private screens = new Map<ScreenId, IScreen>();
  private current: IScreen | null = null;
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  register(screen: IScreen) {
    this.screens.set(screen.id, screen);
  }

  show(id: ScreenId) {
    const next = this.screens.get(id);
    if (!next) throw new Error(`Screen not registered: ${id}`);
    if (this.current) {
      this.current.onHide?.();
      this.current.unmount();
    }
    this.current = next;
    next.mount(this.root);
    next.onShow?.();
  }

  getCurrent(): ScreenId | null { return this.current?.id ?? null; }
}

export default ScreenRouter;
