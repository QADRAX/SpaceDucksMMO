import { createGltfTransformParserAdapter } from './infrastructure/GltfTransformParserAdapter';
import { parseGLBToECSUseCase } from './application/useCases/parseGLBToECSUseCase';
import type { GLTFParsedResult } from './domain/types';

export * from './domain/types';

/**
 * Parses a GLB buffer and extracts engine-ready static ECS data.
 * This function wires the use case with the specific glTF-transform parser adapter.
 * 
 * @param buffer - The loaded GLB byte array.
 * @returns A promise resolving to the object containing extracted entities, meshes, animations, and materials.
 */
export function parseGLBToECS(buffer: Uint8Array): Promise<GLTFParsedResult> {
    const adapter = createGltfTransformParserAdapter();
    return parseGLBToECSUseCase(buffer, adapter);
}
