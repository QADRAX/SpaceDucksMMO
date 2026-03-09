import { definePortImplementation } from '../../domain/useCases';
import { ResourceLoaderPortDef } from '../../domain/ports/resourceLoaderPortDef';
import type { ResourceLoaderPort } from '../../domain/ports';
import { resolveWebResourceUseCase } from '../../application/ports';
import type { WebResourceLoaderState } from '../../application/ports';

/**
 * A strictly-typed PortBinding that fetches resources using the web-core API client.
 * Ready to be directly injected into setupEngine `ports.resourceLoader`.
 */
export const webResourceLoaderPort = definePortImplementation<WebResourceLoaderState, ResourceLoaderPort>(ResourceLoaderPortDef)
    .withState(() => ({ cache: new Map() }))
    .withMethod('resolve', resolveWebResourceUseCase)
    .build();