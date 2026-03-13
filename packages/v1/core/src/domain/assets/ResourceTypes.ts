export type ResourceVersionSelector = 'active' | 'latest' | number;

export interface ResolvedFile {
  id?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  sha256?: string;
  url: string;
}

export interface ResolvedResource {
  key: string;
  resourceId: string;
  version: number;
  componentType: string;
  componentData: Record<string, unknown>;
  files: Record<string, ResolvedFile>;
}
