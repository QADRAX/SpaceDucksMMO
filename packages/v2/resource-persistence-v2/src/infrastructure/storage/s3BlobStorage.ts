import type { Readable } from 'stream';

import type { BlobStorage, SavedBlob } from '../../application/ports/blobStorage';

/**
 * AWS S3 implementation stub.
 *
 * Install `@aws-sdk/client-s3` in the host app and implement {@link BlobStorage}
 * using `PutObject`, `GetObject`, `HeadObject`, `DeleteObject`, and optionally
 * `getSignedUrl` for direct browser downloads.
 *
 * Environment variables typically used: `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
 * `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, optional `S3_PREFIX`.
 */
export class S3BlobStorage implements BlobStorage {
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
