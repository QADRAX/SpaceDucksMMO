export interface ComponentMetadata {
  type: string;
  unique?: boolean;
  requires?: string[];
  conflicts?: string[];
}
