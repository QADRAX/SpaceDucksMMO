/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResourceKindsResponse } from '../models/ResourceKindsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResourcesService {
    /**
     * List supported resource kinds
     * Returns the list of resource kinds currently supported by this API.
     * @returns ResourceKindsResponse Supported resource kinds
     * @throws ApiError
     */
    public static getApiResourcesKinds(): CancelablePromise<ResourceKindsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resources/kinds',
        });
    }
}
