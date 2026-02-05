/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Asset } from '../models/Asset';
import type { AssetVersion } from '../models/AssetVersion';
import type { CreateAssetRequest } from '../models/CreateAssetRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * List all assets
     * Get a paginated list of assets with optional filtering
     * @param type Filter by asset type
     * @param category Filter by category
     * @param tag Filter by tag
     * @param query Search in key and displayName
     * @param page Page number
     * @param limit Items per page
     * @returns any List of assets
     * @throws ApiError
     */
    public static getApiAdminAssets(
        type?: 'material' | 'texture',
        category?: string,
        tag?: string,
        query?: string,
        page: number = 1,
        limit: number = 50,
    ): CancelablePromise<{
        assets?: Array<Asset>;
        total?: number;
        page?: number;
        limit?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/assets',
            query: {
                'type': type,
                'category': category,
                'tag': tag,
                'query': query,
                'page': page,
                'limit': limit,
            },
            errors: {
                400: `Invalid query parameters`,
            },
        });
    }
    /**
     * Create a new asset
     * Creates a new asset with the provided metadata
     * @param requestBody
     * @returns Asset Asset created successfully
     * @throws ApiError
     */
    public static postApiAdminAssets(
        requestBody: CreateAssetRequest,
    ): CancelablePromise<Asset> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/assets',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request body`,
                409: `Asset with this key already exists`,
            },
        });
    }
    /**
     * Get asset details
     * Get detailed information about a specific asset including all versions
     * @param assetId Asset ID
     * @returns any Asset details
     * @throws ApiError
     */
    public static getApiAdminAssets1(
        assetId: string,
    ): CancelablePromise<(Asset & {
        versions?: Array<AssetVersion>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/assets/{assetId}',
            path: {
                'assetId': assetId,
            },
            errors: {
                404: `Asset not found`,
            },
        });
    }
    /**
     * Delete an asset
     * Archives an asset (soft delete) and removes all associated files from storage
     * @param assetId Asset ID
     * @returns any Asset deleted successfully
     * @throws ApiError
     */
    public static deleteApiAdminAssets(
        assetId: string,
    ): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/assets/{assetId}',
            path: {
                'assetId': assetId,
            },
            errors: {
                404: `Asset not found`,
            },
        });
    }
    /**
     * Update version metadata
     * Update status, notes, or default flag for a version
     * @param assetId
     * @param versionId
     * @param requestBody
     * @returns any Version updated successfully
     * @throws ApiError
     */
    public static patchApiAdminAssetsVersions(
        assetId: string,
        versionId: string,
        requestBody?: {
            status?: 'draft' | 'published';
            notes?: string | null;
            isDefault?: boolean;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/assets/{assetId}/versions/{versionId}',
            path: {
                'assetId': assetId,
                'versionId': versionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Version not found`,
            },
        });
    }
}
