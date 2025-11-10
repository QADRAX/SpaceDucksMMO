import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false
    }
  });

  if (!app.isPackaged) {
    // In development we load the Vite dev server
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    win.loadURL(devUrl).catch(() => {
      // fallback to file if dev server not available
      const indexPath = path.join(__dirname, '..', 'index.html');
      win.loadFile(indexPath);
    });
  } else {
    // In production load the built index.html from dist
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    win.loadFile(indexPath);
  }
  mainWindow = win;

  // In development (when app is not packaged) watch the renderer bundle and reload on changes
  if (!app.isPackaged) {
    try {
      const bundlePath = path.join(__dirname, 'renderer.js');
      fs.watch(bundlePath, { persistent: false }, () => {
        try {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.reloadIgnoringCache();
          }
        } catch (e) {
          // ignore
        }
      });
    } catch (e) {
      // watcher failed (file may not exist yet) — ignore in dev flow
    }
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
