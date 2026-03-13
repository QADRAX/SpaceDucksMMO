'use client';

import * as React from 'react';

import {
    createWebCoreResourceLoader,
    type IResourceLoader,
    type ResolvedResource,
    type ResourceVersionSelector,
} from '@duckengine/core';

import { cn } from '@/lib/utils';
import { ThreePreview } from '@/components/molecules/ThreePreview';
import { usePreviewSettings } from '@/hooks/usePreviewSettings';
import { PreviewSettingsContainer } from '@/components/molecules/preview-settings/PreviewSettingsContainer';
import { PreviewSettingGroup } from '@/components/molecules/preview-settings/PreviewSettingGroup';
import { PreviewSettingSlider } from '@/components/molecules/preview-settings/PreviewSettingSlider';
import { PreviewSettingCheckbox } from '@/components/molecules/preview-settings/PreviewSettingCheckbox';

import { SkyboxPreviewScene, type SkyboxPreviewSettings } from './scenes/SkyboxPreviewScene';
import { InlineSettingsService } from './utils/InlineSettingsService';
import { clampNumber } from './utils/previewUtils';

type FaceSlot = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';
export type SkyboxDraftFiles = Record<FaceSlot, string | null>;

type Props = {
    className?: string;
    // Resource mode
    resourceKey?: string;
    activeVersion?: number;
    // Draft mode
    draftFiles?: SkyboxDraftFiles;
};

const defaultPreviewSettings: SkyboxPreviewSettings = {
    camera: { radius: 0.25, height: 0, fov: 70 },
    rotation: { enabled: true, speed: 0.35 },
};

function safeParseSettings(raw: unknown): SkyboxPreviewSettings | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as any;
    const merged: SkyboxPreviewSettings = {
        ...defaultPreviewSettings,
        camera: { ...defaultPreviewSettings.camera, ...(r.camera ?? {}) },
        rotation: { ...defaultPreviewSettings.rotation, ...(r.rotation ?? {}) },
    };

    merged.camera.radius = clampNumber(merged.camera.radius ?? 0.25, 0.01, 100);
    merged.camera.height = clampNumber(merged.camera.height ?? 0, -100, 100);
    merged.camera.fov = clampNumber(merged.camera.fov ?? 70, 10, 160);
    merged.rotation.speed = clampNumber(merged.rotation.speed, 0, 10);
    merged.rotation.enabled = !!merged.rotation.enabled;

    return merged;
}

// -- Resolvers --

function createDraftSkyboxResolver(args: {
    getCurrentKey: () => string;
    getCurrentFiles: () => SkyboxDraftFiles;
}): IResourceLoader {
    return {
        async resolve(key: string): Promise<ResolvedResource> {
            const currentKey = args.getCurrentKey();
            if (key !== currentKey) {
                throw new Error(`Unknown draft skybox key: ${key}`);
            }
            const files = args.getCurrentFiles();
            const resolvedFiles: ResolvedResource['files'] = {};
            (Object.keys(files) as FaceSlot[]).forEach((slot) => {
                const url = files[slot];
                if (!url) return;
                resolvedFiles[slot] = {
                    url,
                    fileName: `${slot}`,
                    contentType: 'image/*',
                };
            });

            return {
                key: currentKey,
                resourceId: 'draft',
                version: 1,
                componentType: 'skybox',
                componentData: {},
                files: resolvedFiles,
            };
        },
    };
}

function createSkyboxMappedResolver(args: {
    baseResolver: IResourceLoader;
    getRealKey: () => string;
    getVersion: () => ResourceVersionSelector;
}): IResourceLoader {
    return {
        async resolve(_key: string, _version?: ResourceVersionSelector): Promise<ResolvedResource> {
            const key = args.getRealKey();
            const version = args.getVersion();
            return await args.baseResolver.resolve(key, version);
        },
    };
}

export function Skybox3DPreview({
    resourceKey,
    activeVersion,
    draftFiles,
    className,
}: Props) {
    const isDraft = !!draftFiles;
    const effectiveKey = resourceKey || 'skybox-preview';

    const [previewSettings, setPreviewSettings] = usePreviewSettings(
        effectiveKey,
        'webcore.preview.skybox',
        defaultPreviewSettings,
        safeParseSettings
    );

    // --- Draft Mode State ---
    const [filesRevision, setFilesRevision] = React.useState(0);
    React.useEffect(() => {
        if (!isDraft || !draftFiles) return;
        try {
            const json = JSON.stringify(draftFiles);
            setFilesRevision((r) => r + 1);
            void json;
        } catch {
            setFilesRevision((r) => r + 1);
        }
    }, [draftFiles, isDraft]);

    const internalDraftKey = React.useMemo(() => {
        return `${effectiveKey}::draftrev:${filesRevision}`;
    }, [effectiveKey, filesRevision]);

    const draftKeyRef = React.useRef(internalDraftKey);
    const draftFilesRef = React.useRef(draftFiles || ({} as SkyboxDraftFiles));
    React.useEffect(() => { draftKeyRef.current = internalDraftKey; }, [internalDraftKey]);
    React.useEffect(() => { draftFilesRef.current = draftFiles || ({} as SkyboxDraftFiles); }, [draftFiles]);

    // --- Resource Mode State ---
    const resourceKeyRef = React.useRef(effectiveKey);
    React.useEffect(() => { resourceKeyRef.current = effectiveKey; }, [effectiveKey]);

    const versionRef = React.useRef<ResourceVersionSelector>('active');
    React.useEffect(() => { versionRef.current = 'active'; }, [activeVersion]);

    const internalResourceKey = React.useMemo(() => {
        return `${effectiveKey}::activev:${activeVersion}`;
    }, [effectiveKey, activeVersion]);


    // --- Combined Internal Key ---
    const currentInternalKey = isDraft ? internalDraftKey : internalResourceKey;

    // --- Scene Initialization ---
    const sceneRef = React.useRef<SkyboxPreviewScene | null>(null);
    const scene = React.useMemo(() => {
        if (typeof window === 'undefined') return null;
        const settings = new InlineSettingsService();
        const s = new SkyboxPreviewScene(settings, currentInternalKey, previewSettings);
        sceneRef.current = s;
        return s;
    }, []); // Singleton-ish

    // Update scene key
    React.useEffect(() => {
        sceneRef.current?.setKey(currentInternalKey);
    }, [currentInternalKey]);

    // Update settings
    React.useEffect(() => {
        sceneRef.current?.applyPreviewSettings(previewSettings);
    }, [previewSettings]);

    // --- Resolver Selection ---
    const resolver = React.useMemo(() => {
        if (isDraft) {
            return createDraftSkyboxResolver({
                getCurrentKey: () => draftKeyRef.current,
                getCurrentFiles: () => draftFilesRef.current,
            });
        } else {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const baseResolver = createWebCoreResourceLoader({ baseUrl });
            return createSkyboxMappedResolver({
                baseResolver,
                getRealKey: () => resourceKeyRef.current,
                getVersion: () => versionRef.current,
            });
        }
    }, [isDraft]); // Re-create if switching modes (unlikely in same component instance, but correct)

    return (
        <div className={cn('h-full w-full min-h-0', className)}>
            <div className="relative h-full w-full min-h-0">
                <ThreePreview
                    scene={scene}
                    resourceLoader={resolver}
                >
                    <PreviewSettingsContainer>
                        <PreviewSettingGroup title="Camera">
                            <PreviewSettingSlider
                                label="Radius"
                                value={previewSettings.camera.radius!}
                                min={0.05} max={10} step={0.05}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, camera: { ...s.camera, radius: v } }))}
                            />
                            <PreviewSettingSlider
                                label="Height"
                                value={previewSettings.camera.height!}
                                min={-10} max={10} step={0.05}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, camera: { ...s.camera, height: v } }))}
                            />
                            <PreviewSettingSlider
                                label="FOV"
                                value={previewSettings.camera.fov!}
                                min={10} max={160} step={1}
                                onChange={(v) => setPreviewSettings(s => ({ ...s, camera: { ...s.camera, fov: v } }))}
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
                    </PreviewSettingsContainer>
                </ThreePreview>
            </div>
        </div>
    );
}
