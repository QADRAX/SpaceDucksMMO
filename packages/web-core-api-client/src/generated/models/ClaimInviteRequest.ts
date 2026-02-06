/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ClaimInviteRequest = {
    token: string;
    /**
     * Minimum 10 characters.
     */
    password: string;
    /**
     * Optional display name override.
     */
    name?: string;
};

