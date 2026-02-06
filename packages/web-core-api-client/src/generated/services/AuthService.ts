/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClaimInviteRequest } from '../models/ClaimInviteRequest';
import type { InvitePublic } from '../models/InvitePublic';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Validate an invite token
     * Public endpoint used by the invitation acceptance page.
     * @param token
     * @returns any Invite is valid
     * @throws ApiError
     */
    public static getApiAuthInviteValidate(
        token: string,
    ): CancelablePromise<{
        ok: boolean;
        invite: InvitePublic;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/invite/validate',
            query: {
                'token': token,
            },
            errors: {
                400: `Missing token`,
                404: `Invalid/expired invite`,
                409: `Already claimed / user already active`,
            },
        });
    }
    /**
     * Claim an invite
     * Public endpoint used by the invitation acceptance page. Sets the password and activates the user.
     * @param requestBody
     * @returns any Invite claimed
     * @throws ApiError
     */
    public static postApiAuthInviteClaim(
        requestBody: ClaimInviteRequest,
    ): CancelablePromise<{
        ok: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/invite/claim',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid payload`,
                404: `Invalid/expired invite`,
                409: `Already claimed / user already active`,
            },
        });
    }
}
