import type { Readable } from 'stream';

import type { BlobStorage, SavedBlob } from '../../application/ports/blobStorage';

/**
 * Azure Blob Storage implementation stub.
 *
 * Install `@azure/storage-blob` in the host and implement {@link BlobStorage}
 * using `BlockBlobClient` upload/download/delete and optional SAS URLs.
 *
 * Environment variables: `AZURE_STORAGE_CONNECTION_STRING` or account + key,
 * plus container name.
 */
export class AzureBlobStorage implements BlobStorage {
  async put(): Promise<SavedBlob> {
    throw new Error('Not implemented');
  }

  async exists(): Promise<boolean> {
    throw new Error('Not implemented');
  }

  openReadStream(): Readable {
    throw new Error('Not implemented');
  }

  async delete(): Promise<void> {
    throw new Error('Not implemented');
  }

  getContentTypeFromExtension(): string {
    return 'application/octet-stream';
  }
}
