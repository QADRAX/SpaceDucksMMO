import { ipcMain } from 'electron';
import type IStorage from '../../domain/ports/IStorage';

export class StorageIpcBridge {
  register(storage: IStorage) {
    ipcMain.handle('spaceducks:storage:readJson', async (_e, key: string) => {
      return storage.readJson(key);
    });
    ipcMain.handle('spaceducks:storage:writeJson', async (_e, key: string, data: unknown) => {
      await storage.writeJson(key, data as any);
    });
    ipcMain.handle('spaceducks:storage:delete', async (_e, key: string) => {
      await storage.delete(key);
    });
  }
}

export default StorageIpcBridge;
