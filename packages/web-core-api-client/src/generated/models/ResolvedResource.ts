/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResolvedFile } from './ResolvedFile';
export type ResolvedResource = {
    key: string;
    resourceId: string;
    version: number;
    componentType: string;
    componentData: Record<string, any>;
    files: Record<string, ResolvedFile>;
};

