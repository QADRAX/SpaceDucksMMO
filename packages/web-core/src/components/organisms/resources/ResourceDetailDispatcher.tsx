import { MaterialComponentTypeSchema, ResourceKindSchema, type MaterialResourceKind } from '@/lib/types';
import { MaterialDetailPanel } from './material/MaterialDetailPanel';
import { CustomMeshDetailPanel } from './custom-mesh/CustomMeshDetailPanel';
import { FullMeshDetailPanel } from './full-mesh/FullMeshDetailPanel';
import { CustomShaderDetailPanel } from './shader/CustomShaderDetailPanel';
import { SkyboxDetailPanel } from './skybox/SkyboxDetailPanel';
import { EcsTreeDetailPanel } from './ecs-tree/EcsTreeDetailPanel';
import { ResourceSummary, VersionSummary } from './types';

type Props = {
    resource: ResourceSummary;
    versions: VersionSummary[];
};

export function ResourceDetailDispatcher({ resource, versions }: Props) {
    const kindParsed = ResourceKindSchema.safeParse(resource.kind);
    const materialKindParsed = MaterialComponentTypeSchema.safeParse(resource.kind);

    if (materialKindParsed.success) {
        return (
            <MaterialDetailPanel
                resource={{
                    id: resource.id,
                    key: resource.key,
                    kind: materialKindParsed.data as MaterialResourceKind,
                    activeVersion: resource.activeVersion,
                }}
                versions={versions}
            />
        );
    }

    if (kindParsed.success) {
        switch (kindParsed.data) {
            case 'customShader':
                return (
                    <CustomShaderDetailPanel
                        resource={{
                            id: resource.id,
                            kind: 'customShader',
                            activeVersion: resource.activeVersion,
                        }}
                        versions={versions}
                    />
                );
            case 'customMesh':
                return (
                    <CustomMeshDetailPanel
                        resource={{
                            id: resource.id,
                            kind: 'customMesh',
                            activeVersion: resource.activeVersion,
                        }}
                        versions={versions}
                    />
                );
            case 'fullMesh':
                return (
                    <FullMeshDetailPanel
                        resource={{
                            id: resource.id,
                            kind: 'fullMesh',
                            activeVersion: resource.activeVersion,
                        }}
                        versions={versions}
                    />
                );
            case 'skybox':
                return (
                    <SkyboxDetailPanel
                        resource={{
                            id: resource.id,
                            kind: 'skybox',
                            activeVersion: resource.activeVersion,
                            key: resource.key,
                        }}
                        versions={versions}
                    />
                );
            case 'prefab':
            case 'scene':
                return (
                    <EcsTreeDetailPanel
                        resource={{
                            id: resource.id,
                            kind: kindParsed.data,
                            activeVersion: resource.activeVersion,
                        }}
                        versions={versions}
                    />
                );
        }
    }

    return (
        <div className="p-6 space-y-2">
            <div className="font-heading">Resource management</div>
            <div className="text-sm text-neutral-600">
                This UI currently supports material, custom mesh, and ECS tree resource kinds.
            </div>
        </div>
    );
}
