/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResolvedResource } from '../models/ResolvedResource';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EngineService {
    /**
     * Resolve a resource for engine runtime
     * Resolve by `key` and optional `version` selector (active | latest | integer). `default` is accepted as an alias for `active`.
     * @param key
     * @param version active | latest | integer
     * @returns ResolvedResource Resolved resource
     * @throws ApiError
     */
    public static getApiEngineResourcesResolve(
        key: string,
        version?: string,
    ): CancelablePromise<ResolvedResource> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/engine/resources/resolve',
            query: {
                'key': key,
                'version': version,
            },
            errors: {
                400: `Missing key / invalid query`,
                404: `Resource or version not found`,
            },
        });
    }
}
