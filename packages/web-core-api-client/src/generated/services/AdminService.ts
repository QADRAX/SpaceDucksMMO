/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateResourceFromZipResponse } from '../models/CreateResourceFromZipResponse';
import type { CreateResourceRequest } from '../models/CreateResourceRequest';
import type { PatchResourceRequest } from '../models/PatchResourceRequest';
import type { Resource } from '../models/Resource';
import type { ResourceSummary } from '../models/ResourceSummary';
import type { ResourceVersion } from '../models/ResourceVersion';
import type { ResourceVersionWithBindings } from '../models/ResourceVersionWithBindings';
import type { ResourceWithVersions } from '../models/ResourceWithVersions';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * List resources
     * @param kind Optional resource kind filter (e.g. standardMaterial)
     * @returns any List of resources
     * @throws ApiError
     */
    public static getApiAdminResources(
        kind?: string,
    ): CancelablePromise<{
        data: Array<ResourceSummary>;
        count: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/resources',
            query: {
                'kind': kind,
            },
        });
    }
    /**
     * Create a resource
     * @param requestBody
     * @returns any Created resource
     * @throws ApiError
     */
    public static postApiAdminResources(
        requestBody: CreateResourceRequest,
    ): CancelablePromise<(Resource | CreateResourceFromZipResponse)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/resources',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload`,
            },
        });
    }
    /**
     * Get a resource with versions
     * @param resourceId
     * @returns ResourceWithVersions Resource
     * @throws ApiError
     */
    public static getApiAdminResources1(
        resourceId: string,
    ): CancelablePromise<ResourceWithVersions> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/resources/{resourceId}',
            path: {
                'resourceId': resourceId,
            },
            errors: {
                404: `Not found`,
            },
        });
    }
    /**
     * Patch resource fields
     * @param resourceId
     * @param requestBody
     * @returns Resource Updated resource
     * @throws ApiError
     */
    public static patchApiAdminResources(
        resourceId: string,
        requestBody: PatchResourceRequest,
    ): CancelablePromise<Resource> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/resources/{resourceId}',
            path: {
                'resourceId': resourceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `No changes / invalid payload`,
            },
        });
    }
    /**
     * Delete a resource
     * Hard-deletes the resource (and cascades versions/bindings). Also deletes any now-unreferenced file blobs from disk.
     * @param resourceId
     * @returns Resource Deleted resource
     * @throws ApiError
     */
    public static deleteApiAdminResources(
        resourceId: string,
    ): CancelablePromise<Resource> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/resources/{resourceId}',
            path: {
                'resourceId': resourceId,
            },
            errors: {
                404: `Not found`,
            },
        });
    }
    /**
     * List versions for a resource
     * @param resourceId
     * @returns any List of versions
     * @throws ApiError
     */
    public static getApiAdminResourcesVersions(
        resourceId: string,
    ): CancelablePromise<{
        data: Array<ResourceVersionWithBindings>;
        count: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/resources/{resourceId}/versions',
            path: {
                'resourceId': resourceId,
            },
        });
    }
    /**
     * Create a new version
     * Supports either a ZIP upload (version.json + slot files) or multipart upload (componentData + any file slot fields). The newly created version becomes the active version.
     * @param resourceId
     * @param formData
     * @returns ResourceVersion Created version
     * @throws ApiError
     */
    public static postApiAdminResourcesVersions(
        resourceId: string,
        formData: {
            /**
             * ZIP containing version.json and slot files (<slot>.<ext>)
             */
            zip?: Blob;
            /**
             * Optional explicit version; if provided must be the next incremental version
             */
            version?: number;
            /**
             * JSON string (optional)
             */
            componentData?: string;
            /**
             * Optional legacy; must match the resource kind when provided
             */
            componentType?: string;
        },
    ): CancelablePromise<ResourceVersion> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/resources/{resourceId}/versions',
            path: {
                'resourceId': resourceId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid payload`,
                404: `Resource not found`,
                409: `Version already exists`,
            },
        });
    }
    /**
     * Set active version for a resource
     * Sets the given version number as the active version for the resource.
     * @param resourceId
     * @param version
     * @returns Resource Updated resource
     * @throws ApiError
     */
    public static putApiAdminResourcesVersionsActive(
        resourceId: string,
        version: number,
    ): CancelablePromise<Resource> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/resources/{resourceId}/versions/{version}/active',
            path: {
                'resourceId': resourceId,
                'version': version,
            },
            errors: {
                400: `Invalid version`,
                404: `Resource or version not found`,
            },
        });
    }
}
