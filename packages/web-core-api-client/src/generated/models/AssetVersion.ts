/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AssetVersion = {
    id?: string;
    assetId?: string;
    version?: string;
    status?: AssetVersion.status;
    isDefault?: boolean;
    notes?: string | null;
    createdAt?: string;
};
export namespace AssetVersion {
    export enum status {
        DRAFT = 'draft',
        PUBLISHED = 'published',
    }
}

