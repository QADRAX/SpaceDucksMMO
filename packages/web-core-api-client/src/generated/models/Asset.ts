/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Asset = {
    /**
     * Unique identifier
     */
    id?: string;
    /**
     * Unique key for the asset
     */
    key?: string;
    /**
     * Human-readable name
     */
    displayName?: string;
    /**
     * Type of asset
     */
    type?: Asset.type;
    /**
     * Category for organization
     */
    category?: string | null;
    /**
     * Tags for searching and filtering
     */
    tags?: Array<string>;
    /**
     * Whether the asset is archived
     */
    isArchived?: boolean;
    createdAt?: string;
    updatedAt?: string;
};
export namespace Asset {
    /**
     * Type of asset
     */
    export enum type {
        MATERIAL = 'material',
        TEXTURE = 'texture',
    }
}

