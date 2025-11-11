import type ScreenId from '../ui/ScreenId';

export interface IScreen {
  id: ScreenId;
  mount(container: HTMLElement): void;
  unmount(): void;
  onShow?(): void;
  onHide?(): void;
}

export default IScreen;
