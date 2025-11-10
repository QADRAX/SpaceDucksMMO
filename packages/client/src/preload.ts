import { contextBridge, ipcRenderer } from 'electron';

// Minimal, safe API for the renderer to query basic info and receive reloads if needed.
contextBridge.exposeInMainWorld('spaceducks', {
  ping: () => 'pong',
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
