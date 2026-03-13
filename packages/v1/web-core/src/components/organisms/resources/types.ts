
export type VersionBindingSummary = {
    id: string;
    slot: string;
    fileAssetId: string;
    fileName: string;
};

export type VersionSummary = {
    id: string;
    version: number;
    componentType: string;
    componentData: string | null;
    bindings: VersionBindingSummary[];
};

export type ResourceSummary = {
    id: string;
    key: string;
    kind: string;
    activeVersion: number;
};
