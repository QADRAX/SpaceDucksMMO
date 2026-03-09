import { definePort } from '../subsystems/definePort';
import type { ResourceLoaderPort } from './resourceLoaderPort';

/**
 * Definition for the ResourceLoaderPort.
 * Handles async resource resolution.
 */
export const ResourceLoaderPortDef = definePort<ResourceLoaderPort>('resourceLoader')
    .addMethod('resolve', { async: true })
    .build();
