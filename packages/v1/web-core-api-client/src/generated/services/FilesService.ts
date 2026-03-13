/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FilesService {
    /**
     * Download a FileAsset by id
     * @param fileId
     * @returns binary Binary file stream
     * @throws ApiError
     */
    public static getApiFiles(
        fileId: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/files/{fileId}',
            path: {
                'fileId': fileId,
            },
            errors: {
                404: `File not found / blob missing`,
            },
        });
    }
}
