import { contextBridge, ipcRenderer } from 'electron';

// Minimal, safe API for the renderer to query basic info and receive reloads if needed.
contextBridge.exposeInMainWorld('spaceducks', {
  ping: () => 'pong',
  storage: {
    readJson: (key: string) => ipcRenderer.invoke('spaceducks:storage:readJson', key),
    writeJson: (key: string, data: unknown) => ipcRenderer.invoke('spaceducks:storage:writeJson', key, data),
    delete: (key: string) => ipcRenderer.invoke('spaceducks:storage:delete', key)
  },
  window: {
    setFullscreen: (fullscreen: boolean) => ipcRenderer.invoke('spaceducks:window:setFullscreen', fullscreen),
    isFullscreen: () => ipcRenderer.invoke('spaceducks:window:isFullscreen'),
  },
  textures: {
    list: () => ipcRenderer.invoke('spaceducks:textures:list')
  },
  // send generic IPC messages
  send: (channel: string, payload: unknown) => {
    ipcRenderer.send(channel, payload);
  },
  // receive messages from main
  on: (channel: string, cb: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    const listener = (event: Electron.IpcRendererEvent, ...args: any[]) => cb(event, ...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
