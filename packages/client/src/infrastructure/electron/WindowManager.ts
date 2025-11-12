import { BrowserWindow } from 'electron';
import type IWindowManager from '../../domain/ports/IWindowManager';

export class WindowManager implements IWindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMainWindow(opts: {
    width?: number;
    height?: number;
    preloadPath: string;
    devUrl?: string;
    prodIndexPath: string;
  }): BrowserWindow {
    const { width = 1280, height = 800, preloadPath, devUrl, prodIndexPath } = opts;

    const win = new BrowserWindow({
      width,
      height,
      webPreferences: {
        contextIsolation: true,
        preload: preloadPath,
        nodeIntegration: false,
      }
    });

    if (devUrl) {
      win.loadURL(devUrl).catch(() => win.loadFile(prodIndexPath));
    } else {
      win.loadFile(prodIndexPath);
    }

    this.mainWindow = win;
    return win;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  setFullscreen(fullscreen: boolean): void {
    if (this.mainWindow) {
      this.mainWindow.setFullScreen(fullscreen);
    }
  }

  isFullscreen(): boolean {
    return this.mainWindow?.isFullScreen() ?? false;
  }
}

export default WindowManager;
