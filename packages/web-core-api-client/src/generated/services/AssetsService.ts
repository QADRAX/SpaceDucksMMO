/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AssetsService {
    /**
     * Get asset manifest
     * Get a manifest of published assets with file URLs for game clients
     * @param type Filter by asset type
     * @param category Filter by category
     * @param tag Filter by tag
     * @returns any Asset manifest with file URLs
     * @throws ApiError
     */
    public static getApiAssetsManifestByQuery(
        type?: 'material' | 'texture',
        category?: string,
        tag?: string,
    ): CancelablePromise<{
        assets?: Array<{
            key?: string;
            displayName?: string;
            type?: string;
            category?: string;
            tags?: Array<string>;
            version?: string;
            files?: Array<{
                fileName?: string;
                url?: string;
                size?: number;
                hash?: string;
                contentType?: string;
                mapType?: string | null;
            }>;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/assets/manifest/by-query',
            query: {
                'type': type,
                'category': category,
                'tag': tag,
            },
            errors: {
                400: `Invalid query parameters`,
            },
        });
    }
}
