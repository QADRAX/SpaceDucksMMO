export {};

declare global {
  interface Window {
    spaceducks?: {
      ping: () => string;
      storage?: {
        readJson: <T = any>(key: string) => Promise<T | undefined>;
        writeJson: (key: string, data: unknown) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
      send: (channel: string, payload: unknown) => void;
      on: (
        channel: string,
        cb: (event: any, ...args: any[]) => void
      ) => () => void;
    };
  }
}
