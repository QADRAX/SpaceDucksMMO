/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FilesService {
    /**
     * Download asset file
     * Download a specific file from an asset version. Use 'latest' as version to get the default/most recent published version.
     * @param assetKey Asset key (may contain slashes)
     * @param version Version number or 'latest'
     * @param fileName File name
     * @returns binary File content
     * @throws ApiError
     */
    public static getApiAssetsFile(
        assetKey: string,
        version: string,
        fileName: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/assets/file/{assetKey}/{version}/{fileName}',
            path: {
                'assetKey': assetKey,
                'version': version,
                'fileName': fileName,
            },
            errors: {
                400: `Invalid path format`,
                404: `Asset, version, or file not found`,
            },
        });
    }
}
