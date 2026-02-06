/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserRole } from './UserRole';
export type User = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    sessionVersion: number;
    lastLoginAt?: string | null;
    createdAt: string;
    updatedAt: string;
};

