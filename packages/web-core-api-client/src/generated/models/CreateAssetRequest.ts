/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateAssetRequest = {
    /**
     * Unique key for the asset
     */
    key: string;
    /**
     * Human-readable name
     */
    displayName: string;
    type: CreateAssetRequest.type;
    category?: string | null;
    tags?: Array<string>;
};
export namespace CreateAssetRequest {
    export enum type {
        MATERIAL = 'material',
        TEXTURE = 'texture',
    }
}

