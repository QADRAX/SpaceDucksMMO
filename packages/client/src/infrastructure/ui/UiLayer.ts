export class UiLayer {
  private root!: HTMLElement;

  constructor(private host: HTMLElement) {}

  mount() {
    const uiRoot = document.createElement('div');
    uiRoot.style.position = 'absolute';
    uiRoot.style.top = '0';
    uiRoot.style.left = '0';
    uiRoot.style.padding = '8px';
    uiRoot.style.fontFamily = 'sans-serif';
    uiRoot.style.color = '#eee';
    uiRoot.style.zIndex = '10';
    this.host.appendChild(uiRoot);
    this.root = uiRoot;
  }

  getRoot(): HTMLElement { return this.root; }
}

export default UiLayer;
