import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import { ResourceKeyDropdown } from '@/components/molecules/ResourceKeyDropdown';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { FullMeshInspector } from './FullMeshInspector';
import { ComponentIcon } from '@/components/icons/ComponentIcon';
import {
    buildInspectorValue,
    diffInspectorValue,
} from './inspectorUtils';
import { CUSTOM_SHADER_RESOURCE_KINDS } from '@duckengine/ecs';
import {
    MATERIAL_RESOURCE_REF_KEY,
    isMaterialComponentType,
} from '@/lib/resourceBackedEditor';
import { resolveMaterialResourceActive } from '@/lib/engineResourceResolution';

interface ComponentListItemProps {
    component: any;
    editor: ReturnType<typeof useSceneEditorV2Context>;
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
    const disabled = editor.gameState !== 'stopped';

    return (
        <div className="border-b border-black/10 px-3 py-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 font-bold text-sm tracking-wide uppercase">
                        <ComponentIcon icon={c?.metadata?.icon} />
                        <div className="truncate">{componentLabel}</div>
                    </div>
                    {componentDescription ? (
                        <div className="mt-1 text-xs text-black/50">{componentDescription}</div>
                    ) : null}
                </div>

                <button
                    type="button"
                    className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                    onClick={() => editor.onRemoveComponent(c.type)}
                    disabled={disabled}
                >
                    ✕ Remove
                </button>
            </div>

            {isMaterial ? (
                <div className="mt-3 space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-black/50">Material Resource</Label>
                    <ResourceKeyDropdown
                        kinds={[String(c.type)]}
                        value={materialResourceKey || null}
                        disabled={disabled}
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
                    <div className="text-xs text-black/50">Uses the active version of the selected resource.</div>
                </div>
            ) : CUSTOM_SHADER_RESOURCE_KINDS.includes(String(c.type) as any) ? (
                <div className="mt-3 space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-black/50">Shader Resource</Label>
                    <ResourceKeyDropdown
                        kinds={[String(c.type)]}
                        value={typeof c?.shaderId === 'string' && c.shaderId.trim() ? c.shaderId : null}
                        disabled={disabled}
                        placeholder="Select custom shader…"
                        onChange={(nextKey) => {
                            editor.onUpdateSelectedComponentData(c.type, { shaderId: nextKey ?? '' });
                        }}
                    />

                    {fields.length ? (
                        <div className="mt-3 border-l-2 border-black/10 pl-2">
                            <EcsInspectorFieldsForm
                                key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}:${String(c.type)}`}
                                fields={fields.filter((f) => String((f as any)?.key) !== 'shaderId') as any}
                                value={value}
                                selectionKey={selectionKey}
                                onChange={(next) => {
                                    const delta = diffInspectorValue(value, next);
                                    if (Object.keys(delta).length) {
                                        editor.onUpdateSelectedComponentData(c.type, { ...delta, live: true });
                                    }
                                }}
                                onCommit={() => {
                                    editor.onUpdateSelectedComponentData(c.type, { live: false });
                                    editor.commitFromCurrentScene();
                                }}
                                disabled={disabled}
                                referenceOptions={referenceOptions}
                            />
                        </div>
                    ) : null}
                </div>
            ) : isCustomGeometry ? (
                <div className="mt-3 space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-black/50">Custom Mesh Resource</Label>
                    <ResourceKeyDropdown
                        kinds={['customMesh']}
                        value={typeof c?.key === 'string' && c.key.trim() ? c.key : null}
                        disabled={disabled}
                        placeholder="Select custom mesh…"
                        onChange={(nextKey) => {
                            editor.onUpdateSelectedComponentData(c.type, { key: nextKey ?? '' });
                        }}
                    />

                    {fields.length ? (
                        <div className="mt-3 border-l-2 border-black/10 pl-2">
                            <EcsInspectorFieldsForm
                                key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}:customGeometry`}
                                fields={fields.filter((f) => String((f as any)?.key) !== 'key') as any}
                                value={value}
                                selectionKey={selectionKey}
                                onChange={(next) => {
                                    const delta = diffInspectorValue(value, next);
                                    if (Object.keys(delta).length) {
                                        editor.onUpdateSelectedComponentData(c.type, { ...delta, live: true });
                                    }
                                }}
                                onCommit={() => {
                                    editor.onUpdateSelectedComponentData(c.type, { live: false });
                                    editor.commitFromCurrentScene();
                                }}
                                disabled={disabled}
                                referenceOptions={referenceOptions}
                            />
                        </div>
                    ) : null}
                </div>
            ) : isSkybox ? (
                <div className="mt-3 space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-black/50">Skybox Resource</Label>
                    <ResourceKeyDropdown
                        kinds={['skybox']}
                        value={typeof c?.key === 'string' && c.key.trim() ? c.key : null}
                        disabled={disabled}
                        placeholder="Select skybox…"
                        onChange={(nextKey) => {
                            editor.onUpdateSelectedComponentData(c.type, { key: nextKey ?? '' });
                        }}
                    />

                    {fields.length ? (
                        <div className="mt-3 border-l-2 border-black/10 pl-2">
                            <EcsInspectorFieldsForm
                                key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}:skybox`}
                                fields={fields.filter((f) => String((f as any)?.key) !== 'key') as any}
                                value={value}
                                selectionKey={selectionKey}
                                onChange={(next) => {
                                    const delta = diffInspectorValue(value, next);
                                    if (Object.keys(delta).length) {
                                        editor.onUpdateSelectedComponentData(c.type, { ...delta, live: true });
                                    }
                                }}
                                onCommit={() => {
                                    editor.onUpdateSelectedComponentData(c.type, { live: false });
                                    editor.commitFromCurrentScene();
                                }}
                                disabled={disabled}
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
                    disabled={disabled}
                />
            ) : fields.length ? (
                <div className="mt-3">
                    <EcsInspectorFieldsForm
                        key={`${selectionKey}:${tab}:${String(c.type)}:${editor.sceneRevision}`}
                        fields={fields as any}
                        value={value}
                        selectionKey={selectionKey}
                        onChange={(next) => {
                            const delta = diffInspectorValue(value, next);
                            if (Object.keys(delta).length) {
                                editor.onUpdateSelectedComponentData(c.type, { ...delta, live: true });
                            }
                        }}
                        onCommit={() => {
                            editor.onUpdateSelectedComponentData(c.type, { live: false });
                            editor.commitFromCurrentScene();
                        }}
                        disabled={disabled}
                        referenceOptions={referenceOptions}
                    />
                </div>
            ) : (
                <div className="mt-3 text-xs text-black/40 italic">No editable fields.</div>
            )}
        </div>
    );
}
