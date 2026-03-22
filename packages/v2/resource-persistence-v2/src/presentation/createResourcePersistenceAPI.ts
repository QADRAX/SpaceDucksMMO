import type { ResourcePersistenceFileDeps } from '../application/ports/resourcePersistenceDeps';
import { createResourceFromJsonUseCase } from '../application/useCases/createResourceFromJson';
import { createResourceFromMultipartUseCase } from '../application/useCases/createResourceFromMultipart';
import { createResourceVersionFromMultipartUseCase } from '../application/useCases/createResourceVersionFromMultipart';
import { deleteResourceUseCase } from '../application/useCases/deleteResource';
import { deleteResourceVersionUseCase } from '../application/useCases/deleteResourceVersion';
import { getResourceWithVersionsUseCase } from '../application/useCases/getResourceWithVersions';
import { listResourcesUseCase } from '../application/useCases/listResources';
import { listResourceVersionsUseCase } from '../application/useCases/listResourceVersions';
import { patchResourceUseCase } from '../application/useCases/patchResource';
import { patchResourceVersionUseCase } from '../application/useCases/patchResourceVersion';
import { setResourceActiveVersionUseCase } from '../application/useCases/setResourceActiveVersion';
import { createResourceFromZipUseCase } from '../application/useCases/createResourceFromZip';
import { getFileAssetDownloadUseCase } from '../application/useCases/getFileAssetDownload';
import { listSupportedResourceKindsUseCase } from '../application/useCases/listSupportedResourceKinds';
import type { ResourcePersistenceUseCaseDeps } from '../application/ports/resourcePersistenceDeps';
import { resolveResourceUseCase } from '../application/useCases/resolveResource';
import type { ResourcePersistenceApplication } from './createResourcePersistenceAPI.docs';

function fileHandlingDeps(deps: ResourcePersistenceUseCaseDeps): ResourcePersistenceFileDeps {
  return {
    resourcePersistence: deps.resourcePersistence,
    blobStorage: deps.blobStorage,
    zipReader: deps.zipReader,
    fileApiPathForFileId: deps.fileApiPathForFileId,
    uploadRegistry: deps.uploadRegistry,
  };
}

/**
 * Composes all resource-persistence use cases into one object (DI root), similar in spirit to
 * {@link buildDuckEngineAPI} / {@link createDuckEngineAPI} in `@duckengine/core-v2`.
 */
export function buildResourcePersistenceAPI(deps: ResourcePersistenceUseCaseDeps): ResourcePersistenceApplication {
  const fileDeps = fileHandlingDeps(deps);

  return {
    deps,

    resolveResource: (params) =>
      resolveResourceUseCase.run(
        { resourcePersistence: deps.resourcePersistence, publicUrls: deps.publicUrls },
        params
      ),

    getFileAssetDownload: (fileId) =>
      getFileAssetDownloadUseCase.run(
        { resourcePersistence: deps.resourcePersistence, blobStorage: deps.blobStorage },
        fileId
      ),

    listSupportedResourceKinds: () => listSupportedResourceKindsUseCase.run(deps, undefined),

    listResources: (input) =>
      listResourcesUseCase.run({ resourcePersistence: deps.resourcePersistence }, input),

    getResourceWithVersions: (input) =>
      getResourceWithVersionsUseCase.run({ resourcePersistence: deps.resourcePersistence }, input),

    patchResource: (input) =>
      patchResourceUseCase.run({ resourcePersistence: deps.resourcePersistence }, input),

    deleteResource: (input) => deleteResourceUseCase.run(fileDeps, input),

    listResourceVersions: (input) =>
      listResourceVersionsUseCase.run({ resourcePersistence: deps.resourcePersistence }, input),

    setResourceActiveVersion: (input) =>
      setResourceActiveVersionUseCase.run({ resourcePersistence: deps.resourcePersistence }, input),

    createResourceFromJson: (input) =>
      createResourceFromJsonUseCase.run({ resourcePersistence: deps.resourcePersistence }, input),

    createResourceFromMultipart: (formData) => createResourceFromMultipartUseCase.run(fileDeps, formData),

    createResourceVersionFromMultipart: (input) =>
      createResourceVersionFromMultipartUseCase.run(fileDeps, input),

    patchResourceVersion: (input) => patchResourceVersionUseCase.run(fileDeps, input),

    deleteResourceVersion: (input) => deleteResourceVersionUseCase.run(fileDeps, input),

    createResourceFromZip: (zipBuffer) =>
      createResourceFromZipUseCase.run(
        {
          resourcePersistence: deps.resourcePersistence,
          blobStorage: deps.blobStorage,
          zipReader: deps.zipReader,
          fileApiPathForFileId: deps.fileApiPathForFileId,
          uploadRegistry: deps.uploadRegistry,
        },
        { zipBuffer }
      ),
  };
}

/** Alias for {@link buildResourcePersistenceAPI} (naming parity with `createDuckEngineAPI`). */
export const createResourcePersistenceAPI = buildResourcePersistenceAPI;
