/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserInviteRequest } from '../models/CreateUserInviteRequest';
import type { CreateUserInviteResponse } from '../models/CreateUserInviteResponse';
import type { PatchUserRequest } from '../models/PatchUserRequest';
import type { User } from '../models/User';
import type { UserInvite } from '../models/UserInvite';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * List users
     * Requires SUPER_ADMIN.
     * @returns any List of users
     * @throws ApiError
     */
    public static getApiAdminUsers(): CancelablePromise<{
        data: Array<User>;
        count: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/users',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Update a user
     * Requires SUPER_ADMIN. Cannot change your own role or disable yourself.
     * @param userId
     * @param requestBody
     * @returns User Updated user
     * @throws ApiError
     */
    public static patchApiAdminUsers(
        userId: string,
        requestBody: PatchUserRequest,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/users/{userId}',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not found`,
            },
        });
    }
    /**
     * List user invites
     * Requires SUPER_ADMIN.
     * @returns any List of invites
     * @throws ApiError
     */
    public static getApiAdminUsersInvites(): CancelablePromise<{
        data: Array<UserInvite>;
        count: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/users/invites',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create a user invite
     * Requires SUPER_ADMIN. The response includes an invite URL that contains a one-time token.
     * There is no email integration; the super admin is expected to share this URL manually.
     *
     * @param requestBody
     * @returns CreateUserInviteResponse Created invite
     * @throws ApiError
     */
    public static postApiAdminUsersInvites(
        requestBody: CreateUserInviteRequest,
    ): CancelablePromise<CreateUserInviteResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/users/invites',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload`,
                401: `Unauthorized`,
                403: `Forbidden`,
                409: `Email already exists`,
            },
        });
    }
}
