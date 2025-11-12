import type { BrowserWindow } from 'electron';

export interface IWindowManager {
  createMainWindow(options?: {
    width?: number;
    height?: number;
    preloadPath: string;
    devUrl?: string;
    prodIndexPath: string;
  }): BrowserWindow;
  getMainWindow(): BrowserWindow | null;
  setFullscreen(fullscreen: boolean): void;
  isFullscreen(): boolean;
}

export default IWindowManager;
