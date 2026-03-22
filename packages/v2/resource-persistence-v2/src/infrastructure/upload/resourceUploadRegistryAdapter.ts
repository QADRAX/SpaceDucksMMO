import type { ResourceUploadRegistryPort } from '../../application/ports/resourceUploadRegistryPort';
import { ResourceUploadRegistry } from './ResourceUploadRegistry';

export function createResourceUploadRegistryAdapter(): ResourceUploadRegistryPort {
  return {
    getHandler(kind: string) {
      return ResourceUploadRegistry.getHandler(kind);
    },
  };
}
