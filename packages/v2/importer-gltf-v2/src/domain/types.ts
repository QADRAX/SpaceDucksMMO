import type {
    MeshGeometryFileData,
    AnimationClipFileData,
    StandardMaterialData,
    CustomGeometryComponent,
    StandardMaterialComponent,
    JointComponent,
    SkinComponent,
    AnimatorComponent
} from '@duckengine/core-v2';

export type ComponentPayload<T extends { type: any }> = { type: T['type'] } & Partial<Omit<T, 'type' | 'metadata'>>;

export type ImportedComponentData =
    | ComponentPayload<CustomGeometryComponent>
    | ComponentPayload<StandardMaterialComponent>
    | ComponentPayload<JointComponent>
    | ComponentPayload<SkinComponent>
    | ComponentPayload<AnimatorComponent>;

export interface ImportedEntityData {
    name: string;
    translation: readonly [number, number, number];
    rotation: readonly [number, number, number, number]; // Quaternion x,y,z,w
    scale: readonly [number, number, number];
    parentId?: string;
    // Added components for logical features
    components: ImportedComponentData[]; // e.g. MeshComponent, StandardMaterialComponent, AnimatorComponent
}

export interface ImportedTextureData {
    name: string;
    mimeType: string;
    buffer: Uint8Array;
}

export interface GLTFParsedResult {
    entities: ImportedEntityData[];
    meshes: Record<string, MeshGeometryFileData>;
    animations: Record<string, AnimationClipFileData>;
    materials: Record<string, StandardMaterialData>;
    textures: Record<string, ImportedTextureData>;
}
