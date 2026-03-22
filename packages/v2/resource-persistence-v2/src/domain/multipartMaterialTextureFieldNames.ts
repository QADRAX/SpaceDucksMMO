import { TEXTURE_SLOT_KEYS } from '@duckengine/core-v2';

/**
 * Multipart field names that map uploads into material `componentData` as texture URLs.
 * Matches {@link TEXTURE_SLOT_KEYS} from `@duckengine/core-v2` (no legacy aliases).
 */
export const MULTIPART_MATERIAL_TEXTURE_FIELD_NAMES = new Set<string>(TEXTURE_SLOT_KEYS);
