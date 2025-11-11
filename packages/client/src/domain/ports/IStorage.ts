export interface IStorage {
  readJson<T>(key: string): Promise<T | undefined>;
  writeJson<T>(key: string, data: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export default IStorage;
