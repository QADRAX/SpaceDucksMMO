import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import { ResourceKeyDropdown } from '@/components/molecules/ResourceKeyDropdown';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { useSceneEditorContext } from '../../SceneEditorContext';
import { FullMeshInspector } from './FullMeshInspector';
import { ComponentIcon } from '@/components/icons/ComponentIcon';
import {
    buildInspectorValue,
    diffInspectorValue,
} from './inspectorUtils';
import {
    MATERIAL_RESOURCE_REF_KEY,
    isMaterialComponentType,
} from '@/lib/resourceBackedEditor';
import { resolveMaterialResourceActive } from '@/lib/engineResourceResolution';

interface ComponentListItemProps {
    component: any;
    editor: ReturnType<typeof useSceneEditorContext>;
    selectionKey: string;
    tab: string;
    referenceOptions: any[];
}

export function ComponentListItem({
    component: c,
    editor,
    selectionKey,
    tab,
    referenceOptions,
}: ComponentListItemProps) {
    const fields = (c.metadata?.inspector?.fields ?? []) as any[];
    const value = buildInspectorValue(c, fields);

    const isMaterial = isMaterialComponentType(String(c.type));
    const isCustomGeometry = String(c.type) === 'customGeometry';
    const isFullMesh = String(c.type) === 'fullMesh';
    const isSkybox = String(c.type) === 'skybox';
    const materialResourceKey = isMaterial
        ? (typeof c?.[MATERIAL_RESOURCE_REF_KEY] === 'string' ? String(c[MATERIAL_RESOURCE_REF_KEY]) : '')
        : '';

    const componentLabel = c?.metadata?.label || c.type;
    const componentDescription = typeof c?.metadata?.description === 'string' ? c.metadata.description.trim() : '';

    return (
        <div className="border-b border-border px-3 py-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <ComponentIcon icon={c?.metadata?.icon} />
                        <div className="truncate">{componentLabel}</div>
                    </div>
                    {componentDescription ? (
                        <div className="mt-1 text-xs text-muted-foreground">{componentDescription}</div>
                    ) : null}
                </div>

                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => editor.onRemoveComponent(c.type)}
                    disabled={editor.mode !== 'edit'}
                >
                    Remove
                </Button>
            </div>

            {isMaterial ? (
                <div className="mt-3 space-y-2">
                    <Label>Material Resource</Label>
                    <ResourceKeyDropdown
                        kinds={[String(c.type)]}
                        value={materialResourceKey || null}
                        disabled={editor.mode !== 'edit'}
                        placeholder="Select material resource…"
                        onChange={async (nextKey) => {
                            if (!nextKey) {
                                editor.onUpdateSelectedComponentData(c.type, { [MATERIAL_RESOURCE_REF_KEY]: '' });
                                return;
                            }

                            editor.setError(null);
                            try {
                                const resolved = await resolveMaterialResourceActive(nextKey);
                                if (resolved.kind !== String(c.type)) {
                                    throw new Error(
                                        `Resource kind '${resolved.kind}' does not match component '${String(c.type)}'`
                                    );
                                }

                                editor.onUpdateSelectedComponentData(c.type, {
                                    [MATERIAL_RESOURCE_REF_KEY]: nextKey,
                                    ...resolved.componentData,
                                });
                            } catch (e) {
                                editor.setError(e instanceof Error ? e.message : 'Failed to apply material resource');
                            }
                        }}
                    />
                    <div className="text-xs text-muted-foreground">Uses the active version of the selected resource.</div>
                </div>
            ) : String(c.type) === 'shaderMaterial' ? (
                <div className="mt-3 space-y-2">
                    <Label>Shader Resource</Label>
                    <ResourceKeyDropdown
                        kinds={['customShader']}
                        value={typeof c?.shaderId === 'string' && c.shaderId.trim() ? c.shaderId : null}
                        disabled={editor.mode !== 'edit'}
                        placeholder="Select custom shader…"
                        onChange={(nextKey) => {
                            editor.onUpdateSelectedComponentData(c.type, { shaderId: nextKey ?? '' });
                        }}
                    />

                    {fields.length ? (
                        <div className="mt-3">
                            <EcsInspectorFieldsForm
                                key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}:shaderMaterial`}
                                fields={fields.filter((f) => String((f as any)?.key) !== 'shaderId') as any}
                                value={value}
                                onChange={(next) => {
                                    const delta = diffInspectorValue(value, next);
                                    if (Object.keys(delta).length) editor.onUpdateSelectedComponentData(c.type, delta);
                                }}
                                disabled={editor.mode !== 'edit'}
                                referenceOptions={referenceOptions}
                            />
                        </div>
                    ) : null}
                </div>
            ) : isCustomGeometry ? (
                <div className="mt-3 space-y-2">
                    <Label>Custom Mesh Resource</Label>
                    <ResourceKeyDropdown
                        kinds={['customMesh']}
                        value={typeof c?.key === 'string' && c.key.trim() ? c.key : null}
                        disabled={editor.mode !== 'edit'}
                        placeholder="Select custom mesh…"
                        onChange={(nextKey) => {
                            editor.onUpdateSelectedComponentData(c.type, { key: nextKey ?? '' });
                        }}
                    />

                    {fields.length ? (
                        <div className="mt-3">
                            <EcsInspectorFieldsForm
                                key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}:customGeometry`}
                                fields={fields.filter((f) => String((f as any)?.key) !== 'key') as any}
                                value={value}
                                onChange={(next) => {
                                    const delta = diffInspectorValue(value, next);
                                    if (Object.keys(delta).length) editor.onUpdateSelectedComponentData(c.type, delta);
                                }}
                                disabled={editor.mode !== 'edit'}
                                referenceOptions={referenceOptions}
                            />
                        </div>
                    ) : null}
                </div>
            ) : isSkybox ? (
                <div className="mt-3 space-y-2">
                    <Label>Skybox Resource</Label>
                    <ResourceKeyDropdown
                        kinds={['skybox']}
                        value={typeof c?.key === 'string' && c.key.trim() ? c.key : null}
                        disabled={editor.mode !== 'edit'}
                        placeholder="Select skybox…"
                        onChange={(nextKey) => {
                            editor.onUpdateSelectedComponentData(c.type, { key: nextKey ?? '' });
                        }}
                    />

                    {fields.length ? (
                        <div className="mt-3">
                            <EcsInspectorFieldsForm
                                key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}:skybox`}
                                fields={fields.filter((f) => String((f as any)?.key) !== 'key') as any}
                                value={value}
                                onChange={(next) => {
                                    const delta = diffInspectorValue(value, next);
                                    if (Object.keys(delta).length) editor.onUpdateSelectedComponentData(c.type, delta);
                                }}
                                disabled={editor.mode !== 'edit'}
                                referenceOptions={referenceOptions}
                            />
                        </div>
                    ) : null}
                </div>
            ) : isFullMesh ? (
                <FullMeshInspector
                    key={`${selectionKey}:${tab}:${String(c.type)}:fullMeshfrag`}
                    comp={c}
                    editor={editor}
                    value={value}
                    fields={fields as any}
                    referenceOptions={referenceOptions}
                    disabled={editor.mode !== 'edit'}
                />
            ) : fields.length ? (
                <div className="mt-3">
                    <EcsInspectorFieldsForm
                        key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}`}
                        fields={fields as any}
                        value={value}
                        onChange={(next) => {
                            const delta = diffInspectorValue(value, next);
                            if (Object.keys(delta).length) editor.onUpdateSelectedComponentData(c.type, delta);
                        }}
                        disabled={editor.mode !== 'edit'}
                        referenceOptions={referenceOptions}
                    />
                </div>
            ) : (
                <div className="mt-3 text-sm text-neutral-600">No editable fields.</div>
            )}
        </div>
    );
}
