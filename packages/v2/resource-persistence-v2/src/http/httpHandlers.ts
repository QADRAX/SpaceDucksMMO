import { Readable } from 'stream';

import { buildResourcePersistenceAPI } from '../presentation/createResourcePersistenceAPI';
import { resourcePersistenceContextToDeps } from '../presentation/resourcePersistenceContext';
import { registerDefaultUploadHandlers } from '../infrastructure/upload/registerDefaultUploadHandlers';
import { createResourceUploadRegistryAdapter } from '../infrastructure/upload/resourceUploadRegistryAdapter';
import { wireResourceWithVersionHistory } from '../presentation/wireResourceCatalog';
import type { ResourcePersistenceContext } from './resourcePersistenceContext';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function maybeBeforeResourceWrite(
  ctx: ResourcePersistenceContext,
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  if (ctx.beforeResourceWriteRequest) {
    const early = await ctx.beforeResourceWriteRequest(request);
    if (early) return early;
  }
  return next();
}

export type ResourcePersistenceHandlers = ReturnType<typeof createResourcePersistenceHandlers>;

/**
 * Web-standard `Request` → `Response` handlers for engine resolve, file download, resource kinds,
 * and catalog CRUD (resource + version persistence).
 */
export function createResourcePersistenceHandlers(ctx: ResourcePersistenceContext) {
  registerDefaultUploadHandlers();
  const api = buildResourcePersistenceAPI({
    ...resourcePersistenceContextToDeps(ctx),
    uploadRegistry: ctx.uploadRegistry ?? createResourceUploadRegistryAdapter(),
  });

  return {
    async handleEngineResourcesResolveGet(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const key = url.searchParams.get('key');
      const version = url.searchParams.get('version');

      if (!key) {
        return json({ error: 'Missing key' }, 400);
      }

      const resolved = await api.resolveResource({ key, version });
      if (!resolved) {
        const resource = await api.deps.resourcePersistence.findResourceSummaryByKey(key);
        if (!resource) {
          return json({ error: 'Resource not found' }, 404);
        }
        return json({ error: 'Version not found' }, 404);
      }

      return json(resolved);
    },

    async handleFilesGet(_request: Request, fileId: string): Promise<Response> {
      const result = await api.getFileAssetDownload(fileId);
      if (!result.ok) {
        return json({ error: result.reason === 'not_found' ? 'File not found' : 'File blob missing' }, 404);
      }

      const webStream = Readable.toWeb(result.stream);
      return new Response(webStream as BodyInit, {
        status: 200,
        headers: {
          'content-type': result.contentType,
          'cache-control': 'public, max-age=31536000, immutable',
          etag: `"${result.sha256}"`,
        },
      });
    },

    async handleResourcesKindsGet(): Promise<Response> {
      const data = await api.listSupportedResourceKinds();
      return json({ data: [...data] });
    },

    async handleCatalogResourcesGet(request: Request): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, request, async () => {
        const url = new URL(request.url);
        const kind = url.searchParams.get('kind');
        const out = await api.listResources({ kindFilter: kind });
        return json(out);
      });
    },

    async handleCatalogResourcesPost(request: Request): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, request, async () => {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
          try {
            const formData = await request.formData();
            const created = await api.createResourceFromMultipart(formData);
            return json(created, 201);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return json({ error: message }, 400);
          }
        }

        const body = await request.json().catch(() => null);
        const created = await api.createResourceFromJson({ body });
        if (!created.ok) {
          return json({ error: created.error }, created.status);
        }
        return json(created.resource, 201);
      });
    },

    async handleCatalogResourceByIdGet(request: Request, resourceId: string): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, request, async () => {
        const resource = await api.getResourceWithVersions({ resourceId });
        if (!resource) {
          return json({ error: 'Resource not found' }, 404);
        }
        return json(wireResourceWithVersionHistory(resource));
      });
    },

    async handleCatalogResourceByIdPatch(request: Request, resourceId: string): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, request, async () => {
        const body = await request.json().catch(() => null);
        const updated = await api.patchResource({ resourceId, body });
        if (!updated.ok) {
          return json({ error: updated.error }, updated.status);
        }
        return json(updated.resource);
      });
    },

    async handleCatalogResourceByIdDelete(_request: Request, resourceId: string): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, _request, async () => {
        try {
          const deleted = await api.deleteResource({ resourceId });
          return json(deleted);
        } catch {
          return json({ error: 'Resource not found' }, 404);
        }
      });
    },

    async handleCatalogResourceVersionsGet(_request: Request, resourceId: string): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, _request, async () => {
        const out = await api.listResourceVersions({ resourceId });
        return json(out);
      });
    },

    async handleCatalogResourceVersionsPost(request: Request, resourceId: string): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, request, async () => {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
          return json({ error: 'Unsupported content-type. Use multipart/form-data.' }, 415);
        }
        try {
          const formData = await request.formData();
          const created = await api.createResourceVersionFromMultipart({ resourceId, formData });
          return json(created, 201);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          if (typeof message === 'string' && message.includes('already exists')) {
            return json({ error: message }, 409);
          }
          if (message === 'Resource not found') {
            return json({ error: message }, 404);
          }
          return json({ error: message }, 400);
        }
      });
    },

    async handleCatalogResourceVersionPatch(
      request: Request,
      resourceId: string,
      version: number
    ): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, request, async () => {
        const contentType = request.headers.get('content-type') || '';
        let formData: FormData | null = null;
        let bodyJson: unknown = null;

        if (contentType.includes('multipart/form-data')) {
          formData = await request.formData();
        } else if (contentType.includes('application/json')) {
          bodyJson = await request.json().catch(() => null);
        } else {
          return json({ error: 'Unsupported content-type. Use application/json or multipart/form-data.' }, 415);
        }

        const updated = await api.patchResourceVersion({
          resourceId,
          versionNumber: version,
          contentType,
          bodyJson,
          formData,
        });
        if (!updated.ok) {
          return json({ error: updated.error }, updated.status);
        }
        return json(updated.version);
      });
    },

    async handleCatalogResourceVersionDelete(_request: Request, resourceId: string, version: number): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, _request, async () => {
        const result = await api.deleteResourceVersion({ resourceId, versionNumber: version });
        if (!result.ok) {
          return json({ error: result.error }, result.status);
        }
        return json(result.deleted);
      });
    },

    async handleCatalogResourceSetActiveVersionPut(
      _request: Request,
      resourceId: string,
      version: number
    ): Promise<Response> {
      return maybeBeforeResourceWrite(ctx, _request, async () => {
        const updated = await api.setResourceActiveVersion({ resourceId, versionNumber: version });
        if (!updated.ok) {
          return json({ error: updated.error }, updated.status);
        }
        return json(updated.resource);
      });
    },
  };
}
