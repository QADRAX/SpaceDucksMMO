'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { ThreePreview } from '@/components/molecules/ThreePreview';
import { usePreviewSettings } from '@/hooks/usePreviewSettings';
import { PreviewSettingsContainer } from '@/components/molecules/preview-settings/PreviewSettingsContainer';
import { PreviewSettingGroup } from '@/components/molecules/preview-settings/PreviewSettingGroup';
import { PreviewSettingSlider } from '@/components/molecules/preview-settings/PreviewSettingSlider';
import { PreviewSettingVector3 } from '@/components/molecules/preview-settings/PreviewSettingVector3';
import { PreviewSettingCheckbox } from '@/components/molecules/preview-settings/PreviewSettingCheckbox';

import type { MaterialResourceKind } from '@/lib/types';
import { CustomMeshPreviewScene, type CustomMeshPreviewSettings } from './scenes/CustomMeshPreviewScene';
import { InlineSettingsService } from './utils/InlineSettingsService';
import { clampNumber } from './utils/previewUtils';

type ResourceListItem = {
    id: string;
    key: string;
    displayName: string;
    kind: string;
};

type Props = {
    resourceKey: string;
    className?: string;
    disableMaterialOverrides?: boolean;
};

const defaultPreviewSettings: CustomMeshPreviewSettings = {
    camera: { x: 0, y: 0, z: 3.25 },
    tiling: { repeatU: 1, repeatV: 1, offsetU: 0, offsetV: 0 },
    lights: {
        ambientIntensity: 0.9,
        directionalIntensity: 1.25,
        directionalX: 2.5,
        directionalY: 2.5,
        directionalZ: 2.5,
    },
    rotation: { enabled: true, speed: 0.35, axis: 'y' },
    material: { source: 'inline', systemKey: '' },
};

function safeParseSettings(raw: unknown): CustomMeshPreviewSettings | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as any;
    const merged: CustomMeshPreviewSettings = {
        ...defaultPreviewSettings,
        camera: { ...defaultPreviewSettings.camera, ...(r.camera ?? {}) },
        tiling: { ...defaultPreviewSettings.tiling, ...(r.tiling ?? {}) },
        lights: { ...defaultPreviewSettings.lights, ...(r.lights ?? {}) },
        rotation: { ...defaultPreviewSettings.rotation, ...(r.rotation ?? {}) },
        material: { ...defaultPreviewSettings.material, ...(r.material ?? {}) },
    };

    merged.camera.z = clampNumber(merged.camera.z ?? 3.25, 0.25, 50);
    merged.lights.ambientIntensity = clampNumber(merged.lights.ambientIntensity, 0, 10);
    merged.lights.directionalIntensity = clampNumber(merged.lights.directionalIntensity, 0, 20);
    merged.rotation.speed = clampNumber(merged.rotation.speed, 0, 10);

    merged.tiling.repeatU = clampNumber(merged.tiling.repeatU, 0, 100);
    merged.tiling.repeatV = clampNumber(merged.tiling.repeatV, 0, 100);
    merged.tiling.offsetU = clampNumber(merged.tiling.offsetU, -100, 100);
    merged.tiling.offsetV = clampNumber(merged.tiling.offsetV, -100, 100);

    merged.material.source = merged.material.source === 'system' ? 'system' : 'inline';
    merged.material.systemKey = String(merged.material.systemKey ?? '');
    return merged;
}

async function resolveMaterialResource(baseUrl: string, key: string) {
    const url = `${baseUrl}/api/engine/resources/resolve?key=${encodeURIComponent(key)}&version=active`;
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = typeof body?.error === 'string' ? body.error : `Failed to resolve material (${res.status})`;
        throw new Error(msg);
    }
    const json = (await res.json()) as any;
    const componentType = String(json?.componentType ?? '');
    const allowed: MaterialResourceKind[] = ['basicMaterial', 'lambertMaterial', 'phongMaterial', 'standardMaterial'];
    if (!allowed.includes(componentType as any)) {
        throw new Error(`Resolved resource is not a material: ${componentType || 'unknown'}`);
    }

    const data: Record<string, unknown> =
        json?.componentData && typeof json.componentData === 'object' && !Array.isArray(json.componentData)
            ? (json.componentData as Record<string, unknown>)
            : {};

    const files = json?.files && typeof json.files === 'object' ? (json.files as Record<string, any>) : {};
    const dataWithResolvedFiles: Record<string, unknown> = { ...data };
    for (const [slot, file] of Object.entries(files)) {
        const fileUrl = (file as any)?.url;
        if (typeof fileUrl === 'string' && fileUrl) {
            dataWithResolvedFiles[slot] = fileUrl;

            // Alias common base-color slots to the engine's material field name.
            if (slot === 'baseColor' || slot === 'albedo') {
                const current = dataWithResolvedFiles.texture;
                if (typeof current !== 'string' || current.trim().length === 0) {
                    dataWithResolvedFiles.texture = fileUrl;
                }
            }
        }
    }

    return { kind: componentType as MaterialResourceKind, componentData: dataWithResolvedFiles };
}

export function CustomMeshPreview({ resourceKey, className, disableMaterialOverrides }: Props) {
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [materialError, setMaterialError] = React.useState<string | null>(null);

    const [systemMaterials, setSystemMaterials] = React.useState<ResourceListItem[] | null>(null);
    const [systemMaterialsError, setSystemMaterialsError] = React.useState<string | null>(null);

    const [previewSettings, setPreviewSettings] = usePreviewSettings(
        resourceKey,
        'webcore.preview.mesh',
        defaultPreviewSettings,
        safeParseSettings
    );

    const sceneRef = React.useRef<CustomMeshPreviewScene | null>(null);

    const scene = React.useMemo(() => {
        if (typeof window === 'undefined') return null;
        const settings = new InlineSettingsService();
        const s = new CustomMeshPreviewScene(settings, resourceKey, !!disableMaterialOverrides);
        sceneRef.current = s;
        return s;
    }, [disableMaterialOverrides]);

    React.useEffect(() => {
        if (sceneRef.current) sceneRef.current.setResourceKey(resourceKey);
    }, [resourceKey]);

    React.useEffect(() => {
        sceneRef.current?.applyPreviewSettings(previewSettings);
    }, [previewSettings]);

    // Material Resolution
    React.useEffect(() => {
        if (!settingsOpen || previewSettings.material.source !== 'system' || systemMaterials) return;

        let cancelled = false;
        (async () => {
            try {
                setSystemMaterialsError(null);
                const res = await fetch('/api/admin/resources');
                if (!res.ok) throw new Error(`Failed to list resources`);
                const json = (await res.json()) as any;
                const data = Array.isArray(json?.data) ? (json.data as ResourceListItem[]) : [];
                const allowed = new Set(['basicMaterial', 'lambertMaterial', 'phongMaterial', 'standardMaterial']);
                const normalized = data
                    .filter((r: any) => r && typeof r.key === 'string' && allowed.has(String(r.kind)))
                    .map((r: any) => ({
                        id: String(r.id ?? r.key),
                        key: String(r.key ?? ''),
                        displayName: String(r.displayName ?? r.key ?? ''),
                        kind: String(r.kind ?? ''),
                    }));
                if (cancelled) return;
                setSystemMaterials(normalized);
            } catch (e) {
                if (cancelled) return;
                setSystemMaterialsError(e instanceof Error ? e.message : 'Failed to load system materials');
                setSystemMaterials([]);
            }
        })();
        return () => { cancelled = true; };
    }, [settingsOpen, previewSettings.material.source, systemMaterials]);

    // Apply Material
    React.useEffect(() => {
        if (disableMaterialOverrides) return;
        const scene = sceneRef.current;
        if (!scene) return;

        if (previewSettings.material.source === 'inline') {
            setMaterialError(null);
            scene.setInlineMaterial();
            return;
        }

        const key = previewSettings.material.systemKey.trim();
        if (!key) {
            setMaterialError('Material key is required.');
            scene.setInlineMaterial();
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                const resolved = await resolveMaterialResource(baseUrl, key);
                if (cancelled) return;
                scene.setMaterialFromResource(resolved.kind, resolved.componentData);
                setMaterialError(null);
            } catch (e) {
                if (cancelled) return;
                setMaterialError(e instanceof Error ? e.message : 'Failed to resolve material');
                scene.setInlineMaterial();
            }
        })();
        return () => { cancelled = true; };
    }, [previewSettings.material.source, previewSettings.material.systemKey, disableMaterialOverrides]);

    return (
        <div className={cn('h-full w-full min-h-0', className)}>
            <div className="relative h-full w-full min-h-0">
                <ThreePreview scene={scene}>
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => setSettingsOpen((v) => !v)}>
                            Preview settings
                        </Button>
                    </div>
                    {materialError && !disableMaterialOverrides && (
                        <div className="absolute left-3 bottom-3 max-w-xs p-3 bg-red-100 border border-red-300 text-red-900 rounded-base text-xs">
                            <strong>Material Error:</strong> {materialError}
                        </div>
                    )}
                    <PreviewSettingsContainer trigger={<></>} label="Preview Settings">
                        <PreviewSettingGroup title="Camera">
                            <PreviewSettingSlider
                                label="Distance (Z)"
                                value={previewSettings.camera.z!}
                                min={0.25} max={50} step={0.25}
                                onChange={v => setPreviewSettings(s => ({ ...s, camera: { ...s.camera, z: v } }))}
                            />
                        </PreviewSettingGroup>

                        <PreviewSettingGroup title="Lighting">
                            <PreviewSettingSlider
                                label="Ambient Intensity"
                                value={previewSettings.lights.ambientIntensity}
                                min={0} max={5} step={0.1}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, lights: { ...s.lights, ambientIntensity: v } }))}
                            />
                            <PreviewSettingSlider
                                label="Directional Intensity"
                                value={previewSettings.lights.directionalIntensity}
                                min={0} max={10} step={0.1}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, lights: { ...s.lights, directionalIntensity: v } }))}
                            />
                            <PreviewSettingVector3
                                label="Directional Light Position"
                                value={{ x: previewSettings.lights.directionalX, y: previewSettings.lights.directionalY, z: previewSettings.lights.directionalZ }}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, lights: { ...s.lights, directionalX: v.x, directionalY: v.y, directionalZ: v.z } }))}
                            />
                        </PreviewSettingGroup>

                        <PreviewSettingGroup title="Rotation">
                            <PreviewSettingCheckbox
                                label="Auto Rotate"
                                checked={previewSettings.rotation.enabled}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, rotation: { ...s.rotation, enabled: v } }))}
                            />
                            <PreviewSettingSlider
                                label="Speed"
                                value={previewSettings.rotation.speed}
                                min={0} max={5} step={0.05}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, rotation: { ...s.rotation, speed: v } }))}
                            />
                        </PreviewSettingGroup>

                        {!disableMaterialOverrides && (
                            <>
                                <PreviewSettingGroup title="Tiling">
                                    <div className="grid grid-cols-2 gap-2">
                                        <PreviewSettingSlider label="Repeat U" value={previewSettings.tiling.repeatU} min={0} max={10} step={0.1} onChange={v => setPreviewSettings(s => ({ ...s, tiling: { ...s.tiling, repeatU: v } }))} />
                                        <PreviewSettingSlider label="Repeat V" value={previewSettings.tiling.repeatV} min={0} max={10} step={0.1} onChange={v => setPreviewSettings(s => ({ ...s, tiling: { ...s.tiling, repeatV: v } }))} />
                                        <PreviewSettingSlider label="Offset U" value={previewSettings.tiling.offsetU} min={-10} max={10} step={0.1} onChange={v => setPreviewSettings(s => ({ ...s, tiling: { ...s.tiling, offsetU: v } }))} />
                                        <PreviewSettingSlider label="Offset V" value={previewSettings.tiling.offsetV} min={-10} max={10} step={0.1} onChange={v => setPreviewSettings(s => ({ ...s, tiling: { ...s.tiling, offsetV: v } }))} />
                                    </div>
                                </PreviewSettingGroup>

                                <PreviewSettingGroup title="Material Override">
                                    <div className="flex gap-4 text-xs">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={previewSettings.material.source === 'inline'} onChange={() => setPreviewSettings(s => ({ ...s, material: { ...s.material, source: 'inline' } }))} />
                                            Default (Grey)
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={previewSettings.material.source === 'system'} onChange={() => setPreviewSettings(s => ({ ...s, material: { ...s.material, source: 'system' } }))} />
                                            System Material
                                        </label>
                                    </div>
                                    {previewSettings.material.source === 'system' && (
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                list="sys-mats"
                                                placeholder="External Material Key"
                                                className="w-full bg-white border border-border rounded px-2 py-1 text-xs"
                                                value={previewSettings.material.systemKey}
                                                onChange={e => setPreviewSettings(s => ({ ...s, material: { ...s.material, systemKey: e.target.value } }))}
                                            />
                                            <datalist id="sys-mats">
                                                {(systemMaterials || []).map(m => <option key={m.id} value={m.key}>{m.displayName}</option>)}
                                            </datalist>
                                            {systemMaterialsError && <div className="text-red-500 text-xs mt-1">{systemMaterialsError}</div>}
                                        </div>
                                    )}
                                </PreviewSettingGroup>
                            </>
                        )}
                    </PreviewSettingsContainer>
                </ThreePreview>
            </div>
        </div>
    );
}
