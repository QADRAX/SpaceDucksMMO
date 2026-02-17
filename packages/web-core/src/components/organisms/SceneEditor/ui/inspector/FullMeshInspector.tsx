import * as React from 'react';
import { Label } from '@/components/atoms/Label';
import { Select } from '@/components/atoms/Select';
import { ResourceKeyDropdown } from '@/components/molecules/ResourceKeyDropdown';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { useSceneEditorContext } from '../../SceneEditorContext';
import { diffInspectorValue } from './inspectorUtils';

interface FullMeshInspectorProps {
    comp: any;
    editor: ReturnType<typeof useSceneEditorContext>;
    value: any;
    fields: any[];
    referenceOptions: any[];
    disabled?: boolean;
}

export function FullMeshInspector({
    comp,
    editor,
    value,
    fields,
    referenceOptions,
    disabled,
}: FullMeshInspectorProps) {
    const key = typeof comp?.key === 'string' && comp.key.trim() ? comp.key : '';
    const [clips, setClips] = React.useState<string[] | null>(null);
    const currentClip = value?.['animation.clipName'] ?? (comp?.animation?.clipName ?? '');

    const fetchClips = React.useCallback(async (resourceKey: string) => {
        if (!resourceKey) {
            setClips(null);
            return;
        }
        try {
            const url = `/api/engine/resources/resolve?key=${encodeURIComponent(resourceKey)}&version=active`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to resolve resource');
            const json = await res.json();
            const data = json?.componentData ?? {};
            const anims = Array.isArray(data?.animations) ? data.animations.map((a: any) => String(a)) : [];
            setClips(anims);
        } catch (e) {
            setClips([]);
        }
    }, []);

    React.useEffect(() => {
        fetchClips(key);
    }, [key, fetchClips]);

    const onChangeKey = async (nextKey: string | null) => {
        editor.onUpdateSelectedComponentData(comp.type, { key: nextKey ?? '' });
        // refresh clips for new key
        await fetchClips(nextKey ?? '');
    };

    return (
        <div className="mt-3 space-y-2">
            <Label>Full Mesh Resource</Label>
            <ResourceKeyDropdown
                kinds={["fullMesh"]}
                value={key || null}
                disabled={!!disabled}
                placeholder="Select full mesh…"
                onChange={(nextKey) => onChangeKey(nextKey)}
            />

            {fields.length ? (
                <div className="mt-3">
                    <EcsInspectorFieldsForm
                        key={`fullmesh-fields-${comp.type}-${editor.sceneRevision}`}
                        fields={(fields as any[]).filter((f) => String((f as any)?.key) !== 'key' && String((f as any)?.key) !== 'animation.clipName') as any}
                        value={value}
                        onChange={(next: any) => {
                            const delta = diffInspectorValue(value, next);
                            if (Object.keys(delta).length) editor.onUpdateSelectedComponentData(comp.type, delta);
                        }}
                        disabled={!!disabled}
                        referenceOptions={referenceOptions}
                    />
                </div>
            ) : null}

            <div className="mt-3">
                <Label>Animation Clip</Label>
                <Select
                    value={currentClip ?? ''}
                    onChange={(e) => {
                        const next = e.target.value;
                        const anim = { ...(comp?.animation || {}), clipName: next };
                        editor.onUpdateSelectedComponentData(comp.type, { animation: anim });
                    }}
                    disabled={!!disabled || clips === null}
                >
                    <option value="">(None)</option>
                    {(clips ?? []).map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </Select>
                <div className="text-xs text-neutral-600">Clips available in the selected resource.</div>
            </div>
        </div>
    );
}
