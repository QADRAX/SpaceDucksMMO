import { MaterialComponentTypeSchema, ResourceKindSchema, type MaterialResourceKind } from '@/lib/types';
import { CustomMeshPreview } from '@/components/molecules/previews/CustomMeshPreview';
import { Skybox3DPreview } from '@/components/molecules/previews/Skybox3DPreview';
import { ModelFilePreview } from '@/components/molecules/previews/ModelFilePreview';
import { MaterialPreview } from '@/components/molecules/previews/MaterialPreview';
import { CustomShaderPreview } from '@/components/molecules/previews/CustomShaderPreview';
import { ResourceSummary } from './types';

type Props = {
    resource: ResourceSummary;
    activeVersionId: string | null;
    previewComponentData?: Record<string, unknown>;
};

export function ResourcePreviewDispatcher({ resource, activeVersionId, previewComponentData = {} }: Props) {
    const kindParsed = ResourceKindSchema.safeParse(resource.kind);
    const materialKindParsed = MaterialComponentTypeSchema.safeParse(resource.kind);

    if (materialKindParsed.success) {
        if (!activeVersionId) return null; // Or some fallback
        return (
            <MaterialPreview
                resourceKey={resource.key}
                kind={materialKindParsed.data as MaterialResourceKind}
                componentData={previewComponentData}
                className="h-full w-full"
            />
        );
    }

    if (kindParsed.success) {
        if (kindParsed.data === 'customMesh' && activeVersionId) {
            return <CustomMeshPreview resourceKey={resource.key} className="h-full w-full" />;
        }
        if (kindParsed.data === 'fullMesh' && activeVersionId) {
            return (
                <CustomMeshPreview
                    resourceKey={resource.key}
                    className="h-full w-full"
                    disableMaterialOverrides
                />
            );
        }
        if (kindParsed.data === 'skybox' && activeVersionId) {
            return (
                <Skybox3DPreview
                    resourceKey={resource.key}
                    activeVersion={resource.activeVersion}
                    className="h-full w-full"
                />
            );
        }
        if (kindParsed.data === 'customShader' && activeVersionId) {
            return (
                <CustomShaderPreview
                    resourceKey={resource.key}
                    uniforms={previewComponentData?.uniforms as Record<string, any> | undefined}
                    className="h-full w-full"
                />
            );
        }
    }

    return (
        <div className="h-full w-full flex items-center justify-center bg-bg">
            <div className="text-sm text-neutral-600">No preview available for this resource kind.</div>
        </div>
    );
}
