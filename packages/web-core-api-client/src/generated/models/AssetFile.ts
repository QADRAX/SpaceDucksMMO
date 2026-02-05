/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AssetFile = {
    id?: string;
    fileName?: string;
    /**
     * File size in bytes
     */
    fileSize?: number;
    /**
     * SHA-256 hash of the file
     */
    hash?: string;
    contentType?: string;
    /**
     * Type of PBR map (for materials)
     */
    mapType?: AssetFile.mapType | null;
};
export namespace AssetFile {
    /**
     * Type of PBR map (for materials)
     */
    export enum mapType {
        ALBEDO = 'albedo',
        NORMAL = 'normal',
        ROUGHNESS = 'roughness',
        METALLIC = 'metallic',
        AO = 'ao',
        HEIGHT = 'height',
        EMISSION = 'emission',
    }
}

