import type { ILoadingOverlay } from '../../domain/ports/ILoadingOverlay';

/**
 * Default HTML-based loading overlay implementation
 *
 * Creates a simple HTML overlay with progress bar and message.
 */
export class DefaultHtmlLoadingOverlay implements ILoadingOverlay {
  private overlay!: HTMLDivElement;
  private progressBar!: HTMLDivElement;
  private messageEl!: HTMLDivElement;
  private isVisible = false;

  constructor(private container: HTMLElement) {
    this.createElements();
  }

  private createElements(): void {
    // Create overlay element
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Create progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 200px;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 20px;
    `;
    const fill = document.createElement('div');
    fill.style.cssText = `
      height: 100%;
      background: #4CAF50;
      width: 0%;
      transition: width 0.3s ease;
    `;
    fill.setAttribute('data-fill', 'true');
    this.progressBar.appendChild(fill);

    // Create message element
    this.messageEl = document.createElement('div');
    this.messageEl.style.cssText = `
      color: white;
      font-size: 14px;
      text-align: center;
    `;
    this.messageEl.textContent = 'Loading...';

    this.overlay.appendChild(this.progressBar);
    this.overlay.appendChild(this.messageEl);
    this.overlay.style.display = 'none';
  }

  show(message?: string): void {
    if (!this.isVisible) {
      this.container.appendChild(this.overlay);
      this.overlay.style.display = 'flex';
      this.isVisible = true;
    }
    if (message) {
      this.messageEl.textContent = message;
    }
  }

  hide(): void {
    if (this.isVisible) {
      this.overlay.style.display = 'none';
      if (this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.isVisible = false;
    }
  }

  setProgress(value: number): void {
    const fill = this.progressBar.querySelector('[data-fill="true"]') as HTMLDivElement;
    if (fill) {
      fill.style.width = `${Math.max(0, Math.min(100, value * 100))}%`;
    }
  }

  setMessage(message: string): void {
    this.messageEl.textContent = message;
  }

  dispose(): void {
    this.hide();
  }
}

/**
 * Factory for creating default HTML loading overlays
 */
export class DefaultHtmlLoadingOverlayFactory {
  createOverlay(container: HTMLElement): ILoadingOverlay {
    return new DefaultHtmlLoadingOverlay(container);
  }
}
