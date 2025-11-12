import { ipcMain } from 'electron';
import type IWindowManager from '@client/domain/ports/IWindowManager';

export function registerWindowIpcHandlers(windowManager: IWindowManager): void {
  ipcMain.handle('spaceducks:window:setFullscreen', async (_e, fullscreen: boolean) => {
    windowManager.setFullscreen(fullscreen);
  });

  ipcMain.handle('spaceducks:window:isFullscreen', async (_e) => {
    return windowManager.isFullscreen();
  });
}

export default registerWindowIpcHandlers;
