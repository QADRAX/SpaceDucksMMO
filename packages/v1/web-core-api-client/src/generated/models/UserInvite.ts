/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserRole } from './UserRole';
export type UserInvite = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    expiresAt: string;
    createdAt: string;
    claimedAt?: string | null;
    createdByUserId?: string;
    claimedByUserId?: string | null;
};

