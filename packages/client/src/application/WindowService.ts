/**
 * Window Service - Application Layer
 * Manages window state (fullscreen, minimize, maximize)
 * Communicates with main process via IPC
 */
export class WindowService {
  /**
   * Set fullscreen mode
   */
  async setFullscreen(fullscreen: boolean): Promise<void> {
    if ((window as any).spaceducks?.window?.setFullscreen) {
      await (window as any).spaceducks.window.setFullscreen(fullscreen);
    }
  }

  /**
   * Get current fullscreen state
   */
  async isFullscreen(): Promise<boolean> {
    if ((window as any).spaceducks?.window?.isFullscreen) {
      return await (window as any).spaceducks.window.isFullscreen();
    }
    return false;
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen(): Promise<void> {
    const current = await this.isFullscreen();
    await this.setFullscreen(!current);
  }
}

export default WindowService;
