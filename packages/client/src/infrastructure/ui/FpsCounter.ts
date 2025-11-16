/**
 * Simple FPS counter overlay for debugging performance.
 * Displays frames per second in the top-left corner.
 */
export class FpsCounter {
  private element: HTMLDivElement;
  private frames: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 0;
  private updateInterval: number = 500; // Update every 500ms
  private running: boolean = false;

  constructor() {
    // Create overlay element
    this.element = document.createElement('div');
    this.element.style.position = 'fixed';
    this.element.style.top = '10px';
    this.element.style.left = '10px';
    this.element.style.padding = '8px 12px';
    this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.element.style.color = '#00ff00';
    this.element.style.fontFamily = 'monospace';
    this.element.style.fontSize = '14px';
    this.element.style.fontWeight = 'bold';
    this.element.style.borderRadius = '4px';
    this.element.style.zIndex = '10000';
    this.element.style.pointerEvents = 'none';
    this.element.style.userSelect = 'none';
    this.element.textContent = 'FPS: --';
  }

  /**
   * Show the FPS counter
   */
  show(): void {
    document.body.appendChild(this.element);
  }

  /**
   * Hide the FPS counter
   */
  hide(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }

  /**
   * Update FPS calculation. Call this every frame.
   */
  update(): void {
    this.frames++;

    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    // Update display every updateInterval milliseconds
    if (elapsed >= this.updateInterval) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastTime = currentTime;

      // Update display with color coding
      this.element.textContent = `FPS: ${this.fps}`;
      
      // Color code based on performance
      if (this.fps >= 55) {
        this.element.style.color = '#00ff00'; // Green - excellent
      } else if (this.fps >= 30) {
        this.element.style.color = '#ffff00'; // Yellow - okay
      } else {
        this.element.style.color = '#ff0000'; // Red - poor
      }
    }
  }

  /**
   * Get current FPS value
   */
  getFps(): number {
    return this.fps;
  }

  /**
   * Set update interval in milliseconds
   */
  setUpdateInterval(ms: number): void {
    this.updateInterval = ms;
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.element.parentElement) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set position
   */
  setPosition(top: string, left: string): void {
    this.element.style.top = top;
    this.element.style.left = left;
  }

  /**
   * Start the FPS counter
   */
  start(): void {
    if (!this.running) {
      this.show();
      this.running = true;
    }
  }

  /**
   * Stop the FPS counter
   */
  stop(): void {
    if (this.running) {
      this.hide();
      this.running = false;
    }
  }

  /**
   * Check if the FPS counter is running
   */
  isRunning(): boolean {
    return this.running;
  }
}

export default FpsCounter;
