import './styles/base.css';

export class UiLayer {
  private root!: HTMLElement;

  constructor(private host: HTMLElement) {}

  mount() {
    const uiRoot = document.createElement('div');
    uiRoot.className = 'ui-root';
    // Ensure overlay above the WebGL canvas if parent styles change.
    uiRoot.style.zIndex = '100';
    this.host.appendChild(uiRoot);
    this.root = uiRoot;
  }

  getRoot(): HTMLElement { return this.root; }
}

export default UiLayer;
