'use client';

import * as React from 'react';

import {
    createWebCoreEngineResourceResolver,
} from '@duckengine/rendering-three';

import { cn } from '@/lib/utils';
import { ThreePreview } from '@/components/molecules/ThreePreview';
import { usePreviewSettings } from '@/hooks/usePreviewSettings';
import { PreviewSettingsContainer } from '@/components/molecules/preview-settings/PreviewSettingsContainer';
import { PreviewSettingGroup } from '@/components/molecules/preview-settings/PreviewSettingGroup';
import { PreviewSettingSlider } from '@/components/molecules/preview-settings/PreviewSettingSlider';
import { PreviewSettingVector3 } from '@/components/molecules/preview-settings/PreviewSettingVector3';
import { PreviewSettingCheckbox } from '@/components/molecules/preview-settings/PreviewSettingCheckbox';
import { PreviewSettingSelect } from '@/components/molecules/preview-settings/PreviewSettingSelect';

import type { MaterialResourceKind } from '@/lib/types';
import { MaterialPreviewScene, type MaterialPreviewSettings, type GeometryType, type MaterialComponentData } from './scenes/MaterialPreviewScene';
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
    kind: MaterialResourceKind;
    componentData: MaterialComponentData;
    className?: string;
};

const defaultPreviewSettings: MaterialPreviewSettings = {
    camera: { x: 0, y: 0, z: 3.25 },
    tiling: { repeatU: 1, repeatV: 1, offsetU: 0, offsetV: 0 },
    lights: {
        ambientIntensity: 0.9,
        directionalIntensity: 1.25,
        directionalX: 2.5,
        directionalY: 2.5,
        directionalZ: 2.5,
    },
    rotation: { enabled: true, speed: 0.5, axis: 'y' },
    geometry: {
        type: 'sphereGeometry',
        customMesh: { key: '' },
        sphere: { radius: 1, widthSegments: 32, heightSegments: 16 },
        box: { width: 1.6, height: 1.6, depth: 1.6 },
        plane: { width: 2, height: 2, widthSegments: 1, heightSegments: 1 },
        cylinder: { radiusTop: 0.8, radiusBottom: 0.8, height: 1.8, radialSegments: 24 },
        cone: { radius: 0.9, height: 1.8, radialSegments: 24 },
        torus: { radius: 0.9, tube: 0.35, radialSegments: 16, tubularSegments: 48 },
    },
};

function safeParseSettings(raw: unknown): MaterialPreviewSettings | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as any;

    const camera = {
        x: Number(r.camera?.x ?? defaultPreviewSettings.camera.x),
        y: Number(r.camera?.y ?? defaultPreviewSettings.camera.y),
        z: Number(r.camera?.z ?? defaultPreviewSettings.camera.z),
    };

    const tiling = {
        repeatU: clampNumber(Number(r.tiling?.repeatU ?? defaultPreviewSettings.tiling.repeatU), 0, 100),
        repeatV: clampNumber(Number(r.tiling?.repeatV ?? defaultPreviewSettings.tiling.repeatV), 0, 100),
        offsetU: clampNumber(Number(r.tiling?.offsetU ?? defaultPreviewSettings.tiling.offsetU), -100, 100),
        offsetV: clampNumber(Number(r.tiling?.offsetV ?? defaultPreviewSettings.tiling.offsetV), -100, 100),
    };

    const lights = {
        ambientIntensity: clampNumber(Number(r.lights?.ambientIntensity ?? defaultPreviewSettings.lights.ambientIntensity), 0, 10),
        directionalIntensity: clampNumber(Number(r.lights?.directionalIntensity ?? defaultPreviewSettings.lights.directionalIntensity), 0, 20),
        directionalX: Number(r.lights?.directionalX ?? defaultPreviewSettings.lights.directionalX),
        directionalY: Number(r.lights?.directionalY ?? defaultPreviewSettings.lights.directionalY),
        directionalZ: Number(r.lights?.directionalZ ?? defaultPreviewSettings.lights.directionalZ),
    };

    const rotation = {
        enabled: !!(r.rotation?.enabled ?? defaultPreviewSettings.rotation.enabled),
        speed: clampNumber(Number(r.rotation?.speed ?? defaultPreviewSettings.rotation.speed), 0, 10),
        axis: (['x', 'y', 'z'].includes(r.rotation?.axis) ? r.rotation.axis : defaultPreviewSettings.rotation.axis) as 'x' | 'y' | 'z',
    };

    const geometry = {
        ...defaultPreviewSettings.geometry,
        ...(r.geometry ?? {}),
        customMesh: {
            ...defaultPreviewSettings.geometry.customMesh,
            ...((r.geometry?.customMesh as any) ?? {}),
        },
    };

    // Camera Z clamp
    camera.z = clampNumber(camera.z, 0.25, 50);

    return {
        camera,
        tiling,
        lights,
        rotation,
        geometry,
    };
}

export function MaterialPreview({ resourceKey, kind, componentData, className }: Props) {
    const [previewSettings, setPreviewSettings] = usePreviewSettings(
        resourceKey,
        'webcore.preview.material',
        defaultPreviewSettings,
        safeParseSettings
    );

    const [systemMeshes, setSystemMeshes] = React.useState<ResourceListItem[] | null>(null);
    const [systemMeshesError, setSystemMeshesError] = React.useState<string | null>(null);

    // Resolver for custom meshes
    const resourceResolver = React.useMemo(() => {
        if (typeof window === 'undefined') return undefined;
        const baseUrl = window.location.origin;
        return createWebCoreEngineResourceResolver({ baseUrl });
    }, []);

    const scene = React.useMemo(() => {
        const settings = new InlineSettingsService();
        return new MaterialPreviewScene(settings, kind, componentData, previewSettings);
    }, []);

    React.useEffect(() => {
        scene.setMaterial(kind, componentData);
    }, [kind, componentData, scene]);

    React.useEffect(() => {
        scene.applyPreviewSettings(previewSettings);
    }, [previewSettings, scene]);

    // Load system meshes if needed
    React.useEffect(() => {
        if (previewSettings.geometry.type !== 'customMesh') return;
        if (systemMeshes) return;

        let cancelled = false;
        (async () => {
            try {
                setSystemMeshesError(null);
                const res = await fetch('/api/admin/resources?kind=customMesh');
                if (!res.ok) throw new Error(`Failed to list system meshes (${res.status})`);
                const json = await res.json();
                const data = Array.isArray(json?.data) ? (json.data as ResourceListItem[]) : [];
                if (cancelled) return;
                setSystemMeshes(data);
            } catch (e) {
                if (cancelled) return;
                setSystemMeshesError(e instanceof Error ? e.message : 'Failed to load system meshes');
                setSystemMeshes([]);
            }
        })();
        return () => { cancelled = true; };
    }, [previewSettings.geometry.type, systemMeshes]);


    return (
        <div className={cn('h-full w-full min-h-0', className)}>
            <div className="relative h-full w-full min-h-0">
                <ThreePreview scene={scene} resourceResolver={resourceResolver}>
                    <PreviewSettingsContainer>
                        <PreviewSettingGroup title="Camera">
                            <PreviewSettingVector3
                                label="Position"
                                value={previewSettings.camera}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, camera: v }))}
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

                        <PreviewSettingGroup title="Geometry">
                            <PreviewSettingSelect
                                label="Type"
                                value={previewSettings.geometry.type}
                                options={[
                                    { label: 'Sphere', value: 'sphereGeometry' },
                                    { label: 'Box', value: 'boxGeometry' },
                                    { label: 'Plane', value: 'planeGeometry' },
                                    { label: 'Cylinder', value: 'cylinderGeometry' },
                                    { label: 'Cone', value: 'coneGeometry' },
                                    { label: 'Torus', value: 'torusGeometry' },
                                    { label: 'System Mesh', value: 'customMesh' },
                                ]}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, geometry: { ...s.geometry, type: v as GeometryType } }))}
                            />
                            {previewSettings.geometry.type === 'sphereGeometry' && (
                                <>
                                    <PreviewSettingSlider
                                        label="Radius"
                                        value={previewSettings.geometry.sphere.radius}
                                        min={0.1} max={5} step={0.1}
                                        onChange={(v) => setPreviewSettings(s => ({ ...s, geometry: { ...s.geometry, sphere: { ...s.geometry.sphere, radius: v } } }))}
                                    />
                                </>
                            )}
                            {previewSettings.geometry.type === 'boxGeometry' && (
                                <PreviewSettingVector3
                                    label="Dimensions"
                                    labels={['W', 'H', 'D']}
                                    value={{ x: previewSettings.geometry.box.width, y: previewSettings.geometry.box.height, z: previewSettings.geometry.box.depth }}
                                    onChange={(v) => setPreviewSettings(s => ({ ...s, geometry: { ...s.geometry, box: { width: v.x, height: v.y, depth: v.z } } }))}
                                />
                            )}
                            {/* Add other geometry params as needed */}
                            {previewSettings.geometry.type === 'customMesh' && (
                                <div className="flex flex-col gap-2">
                                    <div className="text-xs text-neutral-600 font-medium">Mesh Key</div>
                                    <select
                                        className="w-full bg-white border border-border rounded px-2 py-1 text-xs"
                                        value={previewSettings.geometry.customMesh.key}
                                        onChange={(e) => setPreviewSettings(s => ({ ...s, geometry: { ...s.geometry, customMesh: { key: e.target.value } } }))}
                                    >
                                        <option value="">(Select mesh)</option>
                                        {systemMeshes?.map((m) => (
                                            <option key={m.key} value={m.key}>{m.displayName} ({m.key})</option>
                                        ))}
                                    </select>
                                    {systemMeshesError && <div className="text-red-500 text-xs">{systemMeshesError}</div>}
                                </div>
                            )}
                        </PreviewSettingGroup>

                        <PreviewSettingGroup title="Texture Tiling">
                            <div className="grid grid-cols-2 gap-2">
                                <PreviewSettingSlider label="Repeat U" value={previewSettings.tiling.repeatU} min={0} max={10} step={0.1} onChange={v => setPreviewSettings(s => ({ ...s, tiling: { ...s.tiling, repeatU: v } }))} />
                                <PreviewSettingSlider label="Repeat V" value={previewSettings.tiling.repeatV} min={0} max={10} step={0.1} onChange={v => setPreviewSettings(s => ({ ...s, tiling: { ...s.tiling, repeatV: v } }))} />
                                <PreviewSettingSlider label="Offset U" value={previewSettings.tiling.offsetU} min={-10} max={10} step={0.1} onChange={v => setPreviewSettings(s => ({ ...s, tiling: { ...s.tiling, offsetU: v } }))} />
                                <PreviewSettingSlider label="Offset V" value={previewSettings.tiling.offsetV} min={-10} max={10} step={0.1} onChange={v => setPreviewSettings(s => ({ ...s, tiling: { ...s.tiling, offsetV: v } }))} />
                            </div>
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
                            <PreviewSettingSelect
                                label="Axis"
                                value={previewSettings.rotation.axis}
                                options={[{ label: 'X', value: 'x' }, { label: 'Y', value: 'y' }, { label: 'Z', value: 'z' }]}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, rotation: { ...s.rotation, axis: v as any } }))}
                            />
                        </PreviewSettingGroup>
                    </PreviewSettingsContainer>
                </ThreePreview>
            </div>
        </div>
    );
}
