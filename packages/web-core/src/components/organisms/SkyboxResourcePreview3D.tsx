'use client';

import * as React from 'react';

import {
  BaseScene,
  CameraViewComponent,
  Entity,
  NoopFpsController,
  ThreeRenderer,
  createWebCoreEngineResourceResolver,
  type EngineResourceResolver,
  type EngineResolvedResource,
  type EngineResourceVersionSelector,
  type GameSettings,
  type ISettingsService,
} from '@duckengine/rendering-three';

import { getInputServices } from '@duckengine/rendering-three/ecs';
import { SkyboxComponent } from '@duckengine/ecs';

import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { cn } from '@/lib/utils';

type PreviewSettings = {
  camera: {
    radius: number;
    height: number;
    fov: number;
  };
  rotation: {
    enabled: boolean;
    speed: number; // rad/sec
  };
};

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function getPreviewStorageKey(resourceKey: string): string {
  const normalized = resourceKey.trim() || 'draft';
  return `webcore.preview.skyboxResource.${normalized}.v1`;
}

function getPreviewSettingsEvent(resourceKey: string): string {
  const normalized = resourceKey.trim() || 'draft';
  return `webcore:previewSettingsChanged:skyboxResource:${normalized}`;
}

const defaultPreviewSettings: PreviewSettings = {
  camera: { radius: 0.25, height: 0, fov: 70 },
  rotation: { enabled: true, speed: 0.35 },
};

function safeParseSettings(raw: unknown): PreviewSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as any;
  const merged: PreviewSettings = {
    ...defaultPreviewSettings,
    camera: { ...defaultPreviewSettings.camera, ...(r.camera ?? {}) },
    rotation: { ...defaultPreviewSettings.rotation, ...(r.rotation ?? {}) },
  };

  merged.camera.radius = clampNumber(merged.camera.radius, 0.01, 100);
  merged.camera.height = clampNumber(merged.camera.height, -100, 100);
  merged.camera.fov = clampNumber(merged.camera.fov, 10, 160);
  merged.rotation.speed = clampNumber(merged.rotation.speed, 0, 10);
  merged.rotation.enabled = !!merged.rotation.enabled;
  return merged;
}

function loadPreviewSettings(resourceKey: string): PreviewSettings {
  if (typeof window === 'undefined') return defaultPreviewSettings;
  try {
    const raw = window.localStorage.getItem(getPreviewStorageKey(resourceKey));
    if (!raw) return defaultPreviewSettings;
    const parsed = JSON.parse(raw);
    return safeParseSettings(parsed) ?? defaultPreviewSettings;
  } catch {
    return defaultPreviewSettings;
  }
}

function persistPreviewSettings(resourceKey: string, next: PreviewSettings): void {
  try {
    window.localStorage.setItem(getPreviewStorageKey(resourceKey), JSON.stringify(next));
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new Event(getPreviewSettingsEvent(resourceKey)));
  } catch {
    // ignore
  }
}

const defaultSettings: GameSettings = {
  graphics: {
    qualityPreset: 'high',
    antialias: true,
    shadows: false,
    fullscreen: false,
    textureQuality: 'high',
  },
  gameplay: {
    invertMouseY: false,
    mouseSensitivity: 1,
  },
  audio: {
    masterVolume: 0,
    musicVolume: 0,
    sfxVolume: 0,
    muteAll: true,
  },
};

class InlineSettingsService implements ISettingsService {
  private settings: GameSettings = defaultSettings;

  getSettings(): GameSettings {
    return this.settings;
  }

  subscribe(): () => void {
    return () => {};
  }
}

function createSkyboxMappedResolver(args: {
  baseResolver: EngineResourceResolver;
  getRealKey: () => string;
  getVersion: () => EngineResourceVersionSelector;
}): EngineResourceResolver {
  return {
    async resolve(_key: string, _version?: EngineResourceVersionSelector): Promise<EngineResolvedResource> {
      const key = args.getRealKey();
      const version = args.getVersion();
      return await args.baseResolver.resolve(key, version);
    },
  };
}

class SkyboxPreviewScene extends BaseScene {
  readonly id = 'admin-skybox-preview';

  private camera?: Entity;
  private skybox?: Entity;
  private previewSettings: PreviewSettings = defaultPreviewSettings;
  private internalKey: string;
  private angle = 0;

  constructor(settings: ISettingsService, internalKey: string, previewSettings: PreviewSettings) {
    super(settings);
    this.internalKey = internalKey;
    this.previewSettings = previewSettings;
  }

  setup(engine: any, renderScene: any): void {
    super.setup(engine, renderScene);

    this.camera = new Entity('camera', [0, 0, 1]);
    this.camera.addComponent(
      new CameraViewComponent({
        fov: this.previewSettings.camera.fov,
        near: 0.1,
        far: 2000,
        aspect: 1,
      })
    );
    this.addEntity(this.camera);
    this.setActiveCamera(this.camera.id);

    this.skybox = new Entity('skybox');
    this.skybox.addComponent(new SkyboxComponent({ key: this.internalKey } as any));
    this.addEntity(this.skybox);

    this.applyPreviewSettings(this.previewSettings);
  }

  setInternalKey(next: string) {
    this.internalKey = next;
    if (!this.skybox) return;
    try {
      const c = this.skybox.getComponent<any>('skybox');
      if (c) {
        (c as any).key = next;
        if (typeof (c as any).notifyChanged === 'function') (c as any).notifyChanged();
      }
    } catch {
      // ignore
    }
  }

  applyPreviewSettings(next: PreviewSettings) {
    this.previewSettings = next;

    if (this.camera) {
      try {
        const view = this.camera.getComponent<any>('cameraView');
        if (view) (view as any).fov = next.camera.fov;
      } catch {
        // ignore
      }
      this.update(0);
    }
  }

  update(dt: number): void {
    super.update(dt);
    if (!this.camera) return;

    const secs = dt / 1000;
    if (this.previewSettings.rotation.enabled && secs > 0) {
      this.angle += this.previewSettings.rotation.speed * secs;
    }

    const r = this.previewSettings.camera.radius;
    const x = Math.cos(this.angle) * r;
    const z = Math.sin(this.angle) * r;
    const y = this.previewSettings.camera.height;

    this.camera.transform.setPosition(x, y, z);
    this.camera.transform.lookAt({ x: 0, y: 0, z: 0 });
  }
}

export function SkyboxResourcePreview3D({
  resourceKey,
  activeVersion,
  className,
}: {
  resourceKey: string;
  activeVersion: number;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rendererRef = React.useRef<ThreeRenderer | null>(null);
  const sceneRef = React.useRef<SkyboxPreviewScene | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [previewSettings, setPreviewSettings] = React.useState<PreviewSettings>(() => loadPreviewSettings(resourceKey));
  const lastPersistedJsonRef = React.useRef<string | null>(null);

  const realKeyRef = React.useRef(resourceKey);
  React.useEffect(() => {
    realKeyRef.current = resourceKey;
  }, [resourceKey]);

  const versionRef = React.useRef<EngineResourceVersionSelector>('active');
  React.useEffect(() => {
    versionRef.current = 'active';
  }, [activeVersion]);

  const internalKey = React.useMemo(() => {
    return `${resourceKey}::activev:${activeVersion}`;
  }, [resourceKey, activeVersion]);

  React.useEffect(() => {
    setPreviewSettings(loadPreviewSettings(resourceKey));
    lastPersistedJsonRef.current = null;
  }, [resourceKey]);

  React.useEffect(() => {
    sceneRef.current?.setInternalKey(internalKey);
  }, [internalKey]);

  // Keep multiple previews in sync (same page or different tabs).
  React.useEffect(() => {
    const onChanged = () => {
      setPreviewSettings((prev) => {
        const next = loadPreviewSettings(resourceKey);
        try {
          const prevJson = JSON.stringify(prev);
          const nextJson = JSON.stringify(next);
          return prevJson === nextJson ? prev : next;
        } catch {
          return next;
        }
      });
    };
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key !== getPreviewStorageKey(resourceKey)) return;
      onChanged();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(getPreviewSettingsEvent(resourceKey), onChanged as any);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(getPreviewSettingsEvent(resourceKey), onChanged as any);
    };
  }, [resourceKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    let json: string;
    try {
      json = JSON.stringify(previewSettings);
    } catch {
      json = '';
    }
    if (json && lastPersistedJsonRef.current === json) {
      // no-op
    } else {
      lastPersistedJsonRef.current = json || null;
      persistPreviewSettings(resourceKey, previewSettings);
    }
    sceneRef.current?.applyPreviewSettings(previewSettings);
  }, [previewSettings, resourceKey]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setError(null);
    try {
      container.querySelectorAll('canvas').forEach((c) => c.remove());
    } catch {
      // ignore
    }

    let renderer: ThreeRenderer;
    let scene: SkyboxPreviewScene;
    try {
      const fps = new NoopFpsController();
      renderer = new ThreeRenderer(fps);
      renderer.init(container);

      const baseUrl = window.location.origin;
      const baseResolver = createWebCoreEngineResourceResolver({ baseUrl });
      renderer.setEngineResourceResolver(
        createSkyboxMappedResolver({
          baseResolver,
          getRealKey: () => realKeyRef.current,
          getVersion: () => versionRef.current,
        })
      );

      const settings = new InlineSettingsService();
      scene = new SkyboxPreviewScene(settings, internalKey, previewSettings);
      renderer.setScene(scene);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to initialize preview';
      console.error('[SkyboxResourcePreview3D] init failed', e);
      setError(msg);
      return;
    }

    rendererRef.current = renderer;
    sceneRef.current = scene;

    let last = performance.now();
    requestAnimationFrame(() => {
      try {
        renderer.handleResize();
      } catch {
        // ignore
      }
    });

    const tick = (t: number) => {
      const dtMs = t - last;
      last = t;

      try {
        scene.update(dtMs);
        renderer.renderFrame();
        try {
          const input = getInputServices();
          if (input?.mouse?.beginFrame) input.mouse.beginFrame();
        } catch {
          // ignore
        }
      } catch (e) {
        console.error('[SkyboxResourcePreview3D] render failed', e);
        setError(e instanceof Error ? e.message : 'Preview render failed');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    try {
      const ro = new ResizeObserver(() => {
        try {
          renderer.handleResize();
        } catch {
          // ignore
        }
      });
      ro.observe(container);
      resizeObserverRef.current = ro;
    } catch {
      // ignore
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      try {
        resizeObserverRef.current?.disconnect();
      } catch {
        // ignore
      }
      resizeObserverRef.current = null;

      try {
        (renderer as any).dispose?.();
        renderer.stop();
      } catch {
        // ignore
      }

      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className={cn('h-full w-full min-h-0', className)}>
      <div className="relative h-full w-full min-h-0">
        <div ref={containerRef} className="w-full h-full min-h-0 bg-neutral-950" />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setSettingsOpen((v) => !v)}>
            Preview settings
          </Button>
        </div>

        {error ? (
          <div className="absolute left-3 right-3 bottom-3 p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="bg-white">
            <div className="space-y-4">
              <div className="text-xl font-heading">Preview settings</div>

              <div className="space-y-4">
                <div>
                  <div className="font-bold">Camera</div>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">Radius</span>
                      <input
                        type="number"
                        step={0.05}
                        value={previewSettings.camera.radius}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            camera: { ...s.camera, radius: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">Height</span>
                      <input
                        type="number"
                        step={0.05}
                        value={previewSettings.camera.height}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            camera: { ...s.camera, height: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">FOV</span>
                      <input
                        type="number"
                        step={1}
                        value={previewSettings.camera.fov}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            camera: { ...s.camera, fov: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <div className="font-bold">Rotation</div>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={previewSettings.rotation.enabled}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            rotation: { ...s.rotation, enabled: e.target.checked },
                          }))
                        }
                      />
                      <span className="text-neutral-600">Enabled</span>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1 mt-2">
                    <span className="text-neutral-600">Speed (rad/s)</span>
                    <input
                      type="number"
                      step={0.05}
                      value={previewSettings.rotation.speed}
                      onChange={(e) =>
                        setPreviewSettings((s) => ({
                          ...s,
                          rotation: { ...s.rotation, speed: Number(e.target.value) },
                        }))
                      }
                      className="border border-border rounded-base px-2 py-1"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-border">
                <Button type="button" size="sm" variant="secondary" onClick={() => setPreviewSettings(defaultPreviewSettings)}>
                  Reset
                </Button>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setSettingsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
