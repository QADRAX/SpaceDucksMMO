import type { GLTFParsedResult } from '../domain/types';

export interface IGLTFParserPort {
    /**
     * Parses the raw GLB buffer and extracts the ECS and resource data.
     * Implementations of this port (e.g. in infrastructure) will wrap tools like @gltf-transform/core.
     */
    parseBuffer(buffer: Uint8Array): Promise<GLTFParsedResult>;
}
