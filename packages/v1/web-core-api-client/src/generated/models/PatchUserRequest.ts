/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PatchUserRequest = {
    name?: string;
    role?: PatchUserRequest.role;
    isActive?: boolean;
};
export namespace PatchUserRequest {
    export enum role {
        ADMIN = 'ADMIN',
        USER = 'USER',
    }
}

