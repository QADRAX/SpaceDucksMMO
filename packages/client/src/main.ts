import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import { FileStorage } from './infrastructure/storage/FileStorage';
import { WindowManager } from './infrastructure/electron/WindowManager';
import StorageIpcBridge from './infrastructure/ipc/StorageIpcBridge';

const windowManager = new WindowManager();

async function detectDevUrl(): Promise<string | undefined> {
  if (app.isPackaged) return undefined;
  if (process.env.VITE_DEV_SERVER_URL) return process.env.VITE_DEV_SERVER_URL;
  // Try to detect vite dev server on 5173; fallback to prod if not reachable
  const host = '127.0.0.1';
  const port = 5173;
  const isOpen = await new Promise<boolean>(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(200);
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host, () => { socket.end(); resolve(true); });
  });
  return isOpen ? 'http://localhost:5173' : undefined;
}

function createMainWindow(devUrl?: string) {
  const preload = path.join(__dirname, 'preload.js');
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

app.whenReady().then(async () => {
  // Infrastructure wiring
  const storage = new FileStorage();
  const storageBridge = new StorageIpcBridge();
  storageBridge.register(storage);

  const url = await detectDevUrl();
  createMainWindow(url);

  app.on('activate', function () {
    if (windowManager.getMainWindow() === null) createMainWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
