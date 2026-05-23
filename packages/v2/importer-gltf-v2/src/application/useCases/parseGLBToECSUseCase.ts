import type { IGLTFParserPort } from '../ports';
import type { GLTFParsedResult } from '../../domain/types';

/**
 * Use case to process a GLB file buffer and turn it into ECS-ready data.
 * Adheres to Dependency Inversion by relying on IGLTFParserPort for the actual parsing implementation.
 */
export async function parseGLBToECSUseCase(
    buffer: Uint8Array,
    parser: IGLTFParserPort
): Promise<GLTFParsedResult> {
    if (buffer.byteLength === 0) {
        throw new Error('Empty GLB buffer provided.');
    }

    // El use case orquesta el flujo delegando el mapeo bruto al puerto
    // Más adelante aquí se pueden implementar reglas de validación de dominios,
    // filtrados, o mutaciones que dependan puramente de la regla de negocio
    // y no de la herramienta de parseo.
    const result = await parser.parseBuffer(buffer);
    
    return result;
}
