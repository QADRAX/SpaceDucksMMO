import type { ResourcePersistenceUseCaseDeps } from '../application/ports/resourcePersistenceDeps';
import type { ResourceWithVersionHistory } from '../domain/engineResource';
import type {
  CreateResourceFromJsonInput,
  CreateResourceFromJsonResult,
  CreateResourceFromMultipartResult,
  CreateResourceVersionFromMultipartInput,
  CreateResourceFromZipResult,
  DeleteResourceByIdInput,
  DeleteResourceVersionInput,
  DeleteResourceVersionResult,
  FileDownloadResult,
  GetResourceWithVersionsInput,
  ListResourceVersionsInput,
  ListResourceVersionsResult,
  ListResourcesInput,
  ListResourcesResult,
  PatchResourceMetadataInput,
  PatchResourceMetadataResult,
  PatchResourceVersionInput,
  PatchResourceVersionResult,
  ResolvedResourcePayload,
  ResolveResourceParams,
  SetResourceActiveVersionInput,
  SetResourceActiveVersionResult,
} from '../domain/resourcePersistence/useCaseTypes';

/**
 * Facade over all resource-persistence use cases, bound to one {@link ResourcePersistenceUseCaseDeps}.
 * Built by {@link buildResourcePersistenceAPI} / {@link createResourcePersistenceAPI}.
 *
 * Actor-agnostic: the same contract serves HTTP APIs, CLIs, or in-process tests.
 */
export type ResourcePersistenceApplication = {
  readonly deps: ResourcePersistenceUseCaseDeps;

  resolveResource(params: ResolveResourceParams): Promise<ResolvedResourcePayload | null>;
  getFileAssetDownload(fileId: string): Promise<FileDownloadResult>;
  listSupportedResourceKinds(): Promise<readonly string[]>;

  listResources(input: ListResourcesInput): Promise<ListResourcesResult>;
  getResourceWithVersions(input: GetResourceWithVersionsInput): Promise<ResourceWithVersionHistory | null>;
  patchResource(input: PatchResourceMetadataInput): Promise<PatchResourceMetadataResult>;
  deleteResource(input: DeleteResourceByIdInput): Promise<unknown>;
  listResourceVersions(input: ListResourceVersionsInput): Promise<ListResourceVersionsResult>;
  setResourceActiveVersion(input: SetResourceActiveVersionInput): Promise<SetResourceActiveVersionResult>;
  createResourceFromJson(input: CreateResourceFromJsonInput): Promise<CreateResourceFromJsonResult>;
  createResourceFromMultipart(formData: FormData): Promise<CreateResourceFromMultipartResult>;
  createResourceVersionFromMultipart(input: CreateResourceVersionFromMultipartInput): Promise<unknown>;
  patchResourceVersion(input: PatchResourceVersionInput): Promise<PatchResourceVersionResult>;
  deleteResourceVersion(input: DeleteResourceVersionInput): Promise<DeleteResourceVersionResult>;
  createResourceFromZip(zipBuffer: Buffer): Promise<CreateResourceFromZipResult>;
};
