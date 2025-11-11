import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { FileStorage } from './infrastructure/storage/FileStorage';
import { WindowManager } from './infrastructure/electron/WindowManager';
import StorageIpcBridge from './infrastructure/ipc/StorageIpcBridge';

const windowManager = new WindowManager();

function createMainWindow() {
  const preload = path.join(__dirname, 'preload.js');
  const devUrl = !app.isPackaged ? (process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173') : undefined;
  const prodIndex = path.join(__dirname, '..', 'dist', 'index.html');
  const win = windowManager.createMainWindow({
    preloadPath: preload,
    devUrl,
    prodIndexPath: prodIndex,
    width: 1280,
    height: 800
  });

  // Dev auto-reload of renderer after Vite rebuild (optional)
  if (devUrl) {
    try {
      const bundlePath = path.join(__dirname, 'renderer.js');
      fs.watch(bundlePath, { persistent: false }, () => {
        const mainWin = windowManager.getMainWindow();
        if (mainWin && !mainWin.isDestroyed()) {
          mainWin.webContents.reloadIgnoringCache();
        }
      });
    } catch {/* ignore */}
  }

  return win;
}

app.whenReady().then(() => {
  // Infrastructure wiring
  const storage = new FileStorage();
  const storageBridge = new StorageIpcBridge();
  storageBridge.register(storage);

  createMainWindow();

  app.on('activate', function () {
    if (windowManager.getMainWindow() === null) createMainWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
