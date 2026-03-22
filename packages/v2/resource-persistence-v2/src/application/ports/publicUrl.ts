/**
 * Resolves public download URLs for `FileAsset` ids (injected by host; no `request.origin` in domain).
 */
export interface PublicUrlResolver {
  fileUrlForFileId(fileId: string): string;
}

export type PublicUrlResolverOptions = {
  /** e.g. `https://api.example.com` (no trailing slash). */
  baseUrl: string;
  /** Path template with `:fileId` placeholder. Default `/api/files/:fileId`. */
  filesPath?: string;
};

export function createPublicUrlResolver(opts: PublicUrlResolverOptions): PublicUrlResolver {
  const base = opts.baseUrl.replace(/\/$/, '');
  const pathTpl = opts.filesPath ?? '/api/files/:fileId';
  return {
    fileUrlForFileId(fileId: string) {
      return `${base}${pathTpl.replace(':fileId', encodeURIComponent(fileId))}`;
    },
  };
}
