/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateUserInviteRequest = {
    email: string;
    name: string;
    role?: CreateUserInviteRequest.role;
    /**
     * Time-to-live for the invite link (default 168 hours).
     */
    expiresInHours?: number;
};
export namespace CreateUserInviteRequest {
    export enum role {
        ADMIN = 'ADMIN',
        USER = 'USER',
    }
}

