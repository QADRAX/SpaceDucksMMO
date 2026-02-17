'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { ThreePreview } from '@/components/molecules/ThreePreview';
import { Button } from '@/components/atoms/Button';
import { usePreviewSettings } from '@/hooks/usePreviewSettings';
import { PreviewSettingsContainer } from '@/components/molecules/preview-settings/PreviewSettingsContainer';
import { PreviewSettingGroup } from '@/components/molecules/preview-settings/PreviewSettingGroup';
import { PreviewSettingSlider } from '@/components/molecules/preview-settings/PreviewSettingSlider';
import { PreviewSettingVector3 } from '@/components/molecules/preview-settings/PreviewSettingVector3';
import { PreviewSettingCheckbox } from '@/components/molecules/preview-settings/PreviewSettingCheckbox';

import { LocalGlbScene, type LocalGlbPreviewSettings } from './scenes/LocalGlbScene';
import { InlineSettingsService } from './utils/InlineSettingsService';

type Props = {
    file: File | null;
    className?: string;
    onDropFile?: (file: File) => void;
    showAnimations?: boolean;
    onAnimations?: (anims: { name: string; duration: number }[]) => void;
};

type LoadState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'loaded' }
    | { status: 'error'; message: string };

const defaultPreviewSettings: LocalGlbPreviewSettings = {
    camera: { x: 0, y: 0, z: 3.25 },
    lights: {
        ambientIntensity: 0.9,
        directionalIntensity: 1.25,
        directionalX: 2.5,
        directionalY: 2.5,
        directionalZ: 2.5,
    },
    rotation: { enabled: true, speed: 0.5, axis: 'y' },
};

function safeParseSettings(raw: unknown): LocalGlbPreviewSettings | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as any;
    return {
        camera: { ...defaultPreviewSettings.camera, ...(r.camera ?? {}) },
        lights: { ...defaultPreviewSettings.lights, ...(r.lights ?? {}) },
        rotation: { ...defaultPreviewSettings.rotation, ...(r.rotation ?? {}) },
    };
}

export function ModelFilePreview({ file, className, onDropFile, showAnimations, onAnimations }: Props) {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [animations, setAnimations] = React.useState<{ name: string; duration: number }[]>([]);
    const [activeClip, setActiveClip] = React.useState<string | null>(null);
    const [playing, setPlaying] = React.useState<boolean>(false);
    const [looping, setLooping] = React.useState<boolean>(true);
    const [currentTime, setCurrentTime] = React.useState<number>(0);
    const [duration, setDuration] = React.useState<number>(0);
    const [loadState, setLoadState] = React.useState<LoadState>({ status: 'idle' });

    const [previewSettings, setPreviewSettings] = usePreviewSettings(
        'local-glb',
        'webcore.preview.localGlb',
        defaultPreviewSettings,
        safeParseSettings
    );

    const scene = React.useMemo(() => {
        if (typeof window === 'undefined') return null;
        return new LocalGlbScene(new InlineSettingsService(), previewSettings);
    }, []); // Intentional empty deps, scene is singleton-ish for lifetime of component

    // Sync settings to scene
    React.useEffect(() => {
        scene?.applyPreviewSettings(previewSettings);
    }, [scene, previewSettings]);

    React.useEffect(() => {
        if (!scene) return;
        if (!file) {
            scene.cleanup();
            scene.loadState = { status: 'idle' };
            setLoadState({ status: 'idle' });
            setAnimations([]);
            return;
        }

        setLoadState({ status: 'loading' });
        scene.loadFile(file, !!showAnimations).then((anims) => {
            setLoadState(scene.loadState);
            setAnimations(anims);
            if (anims.length > 0) {
                setDuration(anims[0].duration);
                setActiveClip(anims[0].name);
                setPlaying(false);
                onAnimations?.(anims);
            }
        });
    }, [file, scene, showAnimations, onAnimations]);

    const onRender = React.useCallback(() => {
        if (!scene || !activeClip) return;
        const action = scene.actions.get(activeClip);
        if (action) setCurrentTime(action.time);
    }, [scene, activeClip]);

    const togglePlay = () => {
        if (!scene || !activeClip) return;
        if (playing) {
            scene.pauseAction(activeClip);
            setPlaying(false);
        } else {
            scene.playAction(activeClip, looping);
            setPlaying(true);
        }
    };

    const onSelectClip = (name: string) => {
        if (!scene) return;
        if (activeClip) scene.stopAction(activeClip);

        setActiveClip(name);
        const anim = animations.find(a => a.name === name);
        if (anim) setDuration(anim.duration);

        if (playing) scene.playAction(name, looping);
        else scene.seekAction(name, 0);
    };

    const onSeek = (value: number) => {
        if (!scene || !activeClip) return;
        scene.seekAction(activeClip, value);
        setCurrentTime(value);
    };

    const onToggleLoop = () => {
        const next = !looping;
        setLooping(next);
        if (scene && activeClip && playing) scene.playAction(activeClip, next);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const onDragLeave = () => setIsDragOver(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (!f) return;
        if (!f.name.toLowerCase().endsWith('.glb')) return;
        onDropFile?.(f);
    };

    const formatTime = (t: number) => t.toFixed(2);

    return (
        <div
            className={cn('relative h-full w-full min-h-0 group/preview', className)}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <ThreePreview scene={scene} onRender={onRender}>
                <div className={cn(
                    'pointer-events-none absolute inset-0 flex items-center justify-center p-4 transition-opacity z-10',
                    isDragOver ? 'opacity-100' : 'opacity-0'
                )}>
                    <div className="w-full max-w-md p-4 border-2 border-dashed border-white/60 rounded-base bg-black/40 text-white text-sm text-center">
                        Drop a <strong>.glb</strong> file to preview
                    </div>
                </div>

                {loadState.status === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div className="text-sm text-neutral-300 text-center bg-black/50 p-2 rounded">
                            Drop a <strong>.glb</strong> file here
                        </div>
                    </div>
                )}

                {loadState.status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div className="text-sm text-neutral-300 bg-black/50 p-2 rounded">Loading…</div>
                    </div>
                )}

                {loadState.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div className="max-w-lg p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm pointer-events-auto">
                            <strong>Preview error:</strong> {loadState.message}
                        </div>
                    </div>
                )}

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

                    <PreviewSettingGroup title="Rotation">
                        <PreviewSettingCheckbox
                            label="Auto Rotate"
                            checked={previewSettings.rotation.enabled}
                            onChange={(v) => setPreviewSettings(s => ({ ...s, rotation: { ...s.rotation, enabled: v } }))}
                        />
                        <PreviewSettingSlider
                            label="Speed"
                            value={previewSettings.rotation.speed}
                            min={0} max={5} step={0.1}
                            onChange={(v) => setPreviewSettings(s => ({ ...s, rotation: { ...s.rotation, speed: v } }))}
                        />
                    </PreviewSettingGroup>
                </PreviewSettingsContainer>

                {/* Animation Controls Overlay */}
                {showAnimations && animations.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/80 text-white border-t border-white/10 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <select
                                value={activeClip ?? ''}
                                onChange={(e) => onSelectClip(e.target.value)}
                                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs flex-1"
                            >
                                {animations.map((a) => (
                                    <option key={a.name} value={a.name}>{a.name} ({a.duration.toFixed(2)}s)</option>
                                ))}
                            </select>
                            <Button size="sm" variant="secondary" onClick={togglePlay}>
                                {playing ? 'Pause' : 'Play'}
                            </Button>
                            <Button size="sm" variant={looping ? 'default' : 'secondary'} onClick={onToggleLoop}>
                                Loop
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="w-10 text-right">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min={0}
                                max={duration}
                                step={0.01}
                                value={currentTime}
                                onChange={(e) => onSeek(Number(e.target.value))}
                                className="flex-1"
                            />
                            <span className="w-10">{formatTime(duration)}</span>
                        </div>
                    </div>
                )}
            </ThreePreview>
        </div>
    );
}
