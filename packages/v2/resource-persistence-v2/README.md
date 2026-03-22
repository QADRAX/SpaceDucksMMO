# `@duckengine/resource-persistence-v2`

Portable engine resource persistence: Prisma (SQLite/Postgres), pluggable blob storage, ZIP upload pipelines, and Web `Request`/`Response` handlers aligned with `@duckengine/core-v2` `ResolvedResource` / `ResolvedFile`.

**Resource kinds** are the same as in `@duckengine/core-v2` (`RESOURCE_KINDS` / `ResourceKind`): classic materials, shader materials, `mesh`, `animationClip`, `skybox`, `script`, `texture`. Legacy v1 kinds (`prefab`, `scene`, `customMesh`, `fullMesh`) and GLB-specific validation are not included.

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma connection string (e.g. `file:./dev.db` or Postgres URL). |
| `RESOURCE_PERSISTENCE_STORAGE_PATH` | Root directory for `LocalBlobStorage` (also `WEB_CORE_STORAGE_PATH` / `ASSET_STORAGE_PATH` for compatibility). |

## Generated Prisma client

The client is generated into `src/generated/prisma` (not committed). Run `npm run prisma:generate` or `npm run build` after cloning.

## Usage (Next.js App Router)

1. Instantiate `PrismaClient` from this package’s generated output (or your app’s Prisma client that targets the same schema).
2. Wire `LocalBlobStorage`, `AdmZipReader`, and `createPublicUrlResolver({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' })`.
3. Call `createResourcePersistenceHandlers(ctx)` and forward to route handlers.

```ts
// app/api/engine/resources/resolve/route.ts
import {
  PrismaClient,
  AdmZipReader,
  LocalBlobStorage,
  createPublicUrlResolver,
  createResourcePersistenceHandlers,
} from '@duckengine/resource-persistence-v2';

const prisma = new PrismaClient();
const blobStorage = new LocalBlobStorage();
const zipReader = new AdmZipReader();

const handlers = createResourcePersistenceHandlers({
  prisma,
  blobStorage,
  zipReader,
  publicUrls: createPublicUrlResolver({
    baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  }),
});

export async function GET(request: Request) {
  return handlers.handleEngineResourcesResolveGet(request);
}
```

Protect admin routes in the host by passing `beforeAdminRequest` (e.g. session check) on the context.

## Cloud storage

`S3BlobStorage` and `AzureBlobStorage` are stubs documenting the contract; implement with your SDKs (`@aws-sdk/client-s3`, `@azure/storage-blob`) and pass as `BlobStorage`.

## Tests

```bash
npm test
```
