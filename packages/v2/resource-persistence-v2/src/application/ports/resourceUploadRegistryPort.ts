import type { ResourceUploadHandler } from './resourceUploadHandler';

export interface ResourceUploadRegistryPort {
  getHandler(kind: string): ResourceUploadHandler;
}
