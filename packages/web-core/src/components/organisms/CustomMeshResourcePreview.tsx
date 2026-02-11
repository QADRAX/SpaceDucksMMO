'use client';

import * as React from 'react';

import {
  AmbientLightComponent,
  BaseScene,
  BasicMaterialComponent,
  CameraViewComponent,
  DirectionalLightComponent,
  Entity,
  NoopFpsController,
  LambertMaterialComponent,
  PhongMaterialComponent,
  StandardMaterialComponent,
  ThreeRenderer,
  createWebCoreEngineResourceResolver,
  type GameSettings,
  type ISettingsService,
} from '@duckengine/rendering-three';

import { getInputServices } from '@duckengine/rendering-three/ecs';

import { CustomGeometryComponent, TextureTilingComponent } from '@duckengine/ecs';

import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { cn } from '@/lib/utils';

import type { MaterialResourceKind } from '@/lib/types';

type ResourceListItem = {
  id: string;
  key: string;
  displayName: string;
  kind: string;
};

type Props = {
  resourceKey: string;
  className?: string;
};

type PreviewSettings = {
  camera: {
    x: number;
    y: number;
    z: number;
  };
  tiling: {
    repeatU: number;
    repeatV: number;
    offsetU: number;
    offsetV: number;
  };
  lights: {
    ambientIntensity: number;
    directionalIntensity: number;
    directionalX: number;
    directionalY: number;
    directionalZ: number;
  };
  rotation: {
    enabled: boolean;
    speed: number; // rad/sec
  };
  material: {
    source: 'inline' | 'system';
    systemKey: string;
  };
};

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function getPreviewStorageKey(resourceKey: string): string {
  const normalized = resourceKey.trim() || 'draft';
  return `webcore.preview.mesh.${normalized}.v1`;
}

function getPreviewSettingsEvent(resourceKey: string): string {
  const normalized = resourceKey.trim() || 'draft';
  return `webcore:previewSettingsChanged:mesh:${normalized}`;
}

const defaultPreviewSettings: PreviewSettings = {
  camera: { x: 0, y: 0, z: 3.25 },
  tiling: { repeatU: 1, repeatV: 1, offsetU: 0, offsetV: 0 },
  lights: {
    ambientIntensity: 0.9,
    directionalIntensity: 1.25,
    directionalX: 2.5,
    directionalY: 2.5,
    directionalZ: 2.5,
  },
  rotation: { enabled: true, speed: 0.35 },
  material: { source: 'inline', systemKey: '' },
};

function safeParseSettings(raw: unknown): PreviewSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as any;
  const merged: PreviewSettings = {
    ...defaultPreviewSettings,
    camera: { ...defaultPreviewSettings.camera, ...(r.camera ?? {}) },
    tiling: { ...defaultPreviewSettings.tiling, ...(r.tiling ?? {}) },
    lights: { ...defaultPreviewSettings.lights, ...(r.lights ?? {}) },
    rotation: { ...defaultPreviewSettings.rotation, ...(r.rotation ?? {}) },
    material: { ...defaultPreviewSettings.material, ...(r.material ?? {}) },
  };

  merged.camera.z = clampNumber(merged.camera.z, 0.25, 50);
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

function createMaterialComponent(kind: MaterialResourceKind, data: Record<string, unknown>) {
  switch (kind) {
    case 'basicMaterial':
      return new BasicMaterialComponent(data as any);
    case 'lambertMaterial':
      return new LambertMaterialComponent(data as any);
    case 'phongMaterial':
      return new PhongMaterialComponent(data as any);
    case 'standardMaterial':
    default:
      return new StandardMaterialComponent(data as any);
  }
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
      // In ECS material components, the albedo map is typically `texture`.
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

const defaultSettings: GameSettings = {
  graphics: {
    qualityPreset: 'high',
    antialias: true,
    shadows: true,
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

class CustomMeshPreviewScene extends BaseScene {
  readonly id = 'admin-custom-mesh-preview';

  private mesh?: Entity;
  private camera?: Entity;
  private ambient?: Entity;
  private dir?: Entity;

  private rotationEnabled = true;
  private rotationSpeed = 0.35; // rad/sec

  constructor(settings: ISettingsService, private readonly resourceKey: string) {
    super(settings);
  }

  setup(engine: any, renderScene: any): void {
    super.setup(engine, renderScene);

    this.camera = new Entity('camera', [0, 0, 3.25]);
    this.camera.addComponent(
      new CameraViewComponent({
        fov: 55,
        near: 0.1,
        far: 2000,
        aspect: 1,
      })
    );
    this.addEntity(this.camera);
    this.setActiveCamera(this.camera.id);
    this.camera.transform.lookAt({ x: 0, y: 0, z: 0 });

    this.ambient = new Entity('ambient');
    this.ambient.addComponent(new AmbientLightComponent({ intensity: 0.9 } as any));
    this.addEntity(this.ambient);

    this.dir = new Entity('dirLight', [2.5, 2.5, 2.5]);
    this.dir.addComponent(new DirectionalLightComponent({ intensity: 1.25 } as any));
    this.addEntity(this.dir);

    // Mesh entity:
    // - starts with placeholder geometry (engine will swap it once GLB loads)
    // - uses a standard material to make the shape readable
    this.mesh = new Entity('mesh');
    this.mesh.addComponent(new CustomGeometryComponent({ key: this.resourceKey }));
    this.mesh.addComponent(this.createInlineMaterial());
    this.mesh.addComponent(new TextureTilingComponent() as any);
    this.addEntity(this.mesh);
  }

  private createInlineMaterial() {
    return new StandardMaterialComponent({
      color: '#d1d5db',
      roughness: 0.6,
      metalness: 0.1,
    } as any);
  }

  applyPreviewSettings(next: PreviewSettings) {
    if (this.camera) {
      this.camera.transform.setPosition(next.camera.x, next.camera.y, next.camera.z);
      this.camera.transform.lookAt({ x: 0, y: 0, z: 0 });
    }

    if (this.ambient) {
      try {
        const a = this.ambient.getComponent<AmbientLightComponent>('ambientLight');
        (a as any).intensity = next.lights.ambientIntensity;
      } catch {
        // ignore
      }
    }

    if (this.dir) {
      this.dir.transform.setPosition(next.lights.directionalX, next.lights.directionalY, next.lights.directionalZ);
      try {
        const d = this.dir.getComponent<DirectionalLightComponent>('directionalLight');
        (d as any).intensity = next.lights.directionalIntensity;
      } catch {
        // ignore
      }
    }

    this.rotationEnabled = next.rotation.enabled;
    this.rotationSpeed = next.rotation.speed;

    if (this.mesh) {
      let tiling = this.mesh.getComponent<any>('textureTiling');
      if (!tiling) {
        this.mesh.addComponent(new TextureTilingComponent() as any);
        tiling = this.mesh.getComponent<any>('textureTiling');
      }
      if (tiling) {
        tiling.repeatU = next.tiling.repeatU;
        tiling.repeatV = next.tiling.repeatV;
        tiling.offsetU = next.tiling.offsetU;
        tiling.offsetV = next.tiling.offsetV;
      }
    }
  }

  setInlineMaterial() {
    if (!this.mesh) return;
    this.removeMaterialComponents();
    this.mesh.addComponent(this.createInlineMaterial());
  }

  setMaterialFromResource(kind: MaterialResourceKind, componentData: Record<string, unknown>) {
    if (!this.mesh) return;
    this.removeMaterialComponents();
    this.mesh.addComponent(createMaterialComponent(kind, componentData));
  }

  private removeMaterialComponents() {
    if (!this.mesh) return;
    const types: MaterialResourceKind[] = ['basicMaterial', 'lambertMaterial', 'phongMaterial', 'standardMaterial'];
    for (const t of types) {
      if (this.mesh.hasComponent(t)) this.mesh.removeComponent(t);
    }
  }

  setResourceKey(next: string) {
    if (!this.mesh) return;
    const existing = this.mesh.getComponent<CustomGeometryComponent>('customGeometry');
    if (existing && existing.key === next) return;

    // ECS Component.notifyChanged() is protected; to trigger render sync reliably,
    // replace the component (remove + add) which emits component events.
    try {
      if (this.mesh.hasComponent('customGeometry')) {
        this.mesh.removeComponent('customGeometry');
      }
    } catch {
      // ignore
    }
    this.mesh.addComponent(new CustomGeometryComponent({ key: next }));
  }

  update(dt: number): void {
    super.update(dt);
    if (!this.mesh) return;
    if (!this.rotationEnabled) return;
    const secs = dt / 1000;
    const r = this.mesh.transform.localRotation;
    this.mesh.transform.setRotation(r.x, r.y + secs * this.rotationSpeed, r.z);
  }
}

export function CustomMeshResourcePreview({ resourceKey, className }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rendererRef = React.useRef<ThreeRenderer | null>(null);
  const sceneRef = React.useRef<CustomMeshPreviewScene | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [materialError, setMaterialError] = React.useState<string | null>(null);

  const [systemMaterials, setSystemMaterials] = React.useState<ResourceListItem[] | null>(null);
  const [systemMaterialsError, setSystemMaterialsError] = React.useState<string | null>(null);

  const [previewSettings, setPreviewSettings] = React.useState<PreviewSettings>(() =>
    loadPreviewSettings(resourceKey)
  );
  const lastPersistedJsonRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setPreviewSettings(loadPreviewSettings(resourceKey));
  }, [resourceKey]);

  React.useEffect(() => {
    const onChanged = () => {
      setPreviewSettings((prev) => {
        const next = loadPreviewSettings(resourceKey);
        try {
          return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
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
    if (!settingsOpen) return;
    if (previewSettings.material.source !== 'system') return;
    if (systemMaterials) return;

    let cancelled = false;
    (async () => {
      try {
        setSystemMaterialsError(null);
        const res = await fetch('/api/admin/resources');
        if (!res.ok) throw new Error(`Failed to list resources (${res.status})`);
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

    return () => {
      cancelled = true;
    };
  }, [settingsOpen, previewSettings.material.source, systemMaterials]);

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

    // React 18 StrictMode can run effects twice; make it idempotent.
    try {
      container.querySelectorAll('canvas').forEach((c) => c.remove());
    } catch {
      // ignore
    }

    let renderer: ThreeRenderer;
    let scene: CustomMeshPreviewScene;

    try {
      const fps = new NoopFpsController();
      renderer = new ThreeRenderer(fps);
      renderer.init(container);

      // Use the same resolver path the runtime uses.
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      renderer.setEngineResourceResolver(createWebCoreEngineResourceResolver({ baseUrl }));

      const settings = new InlineSettingsService();
      scene = new CustomMeshPreviewScene(settings, resourceKey);
      renderer.setScene(scene);

      try {
        scene.applyPreviewSettings(previewSettings);
      } catch {
        // ignore
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to initialize preview';
      console.error('[CustomMeshResourcePreview] init failed', e);
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
        console.error('[CustomMeshResourcePreview] render failed', e);
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
      } catch {}
      resizeObserverRef.current = null;

      try {
        renderer.dispose();
      } catch {
        try {
          renderer.stop();
        } catch {}
      }

      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    sceneRef.current?.setResourceKey(resourceKey);
  }, [resourceKey]);

  React.useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

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

    return () => {
      cancelled = true;
    };
  }, [previewSettings.material.source, previewSettings.material.systemKey]);

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
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="max-w-lg p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
              <strong>Preview error:</strong> {error}
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="p-0 w-full max-w-2xl">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl font-heading">Preview settings</div>
                <div className="text-sm text-neutral-600 mt-1">Saved locally per mesh resource</div>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setSettingsOpen(false)}>
                Close
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <div className="font-bold">Lights</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">Ambient</span>
                      <input
                        type="number"
                        step={0.1}
                        value={previewSettings.lights.ambientIntensity}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            lights: { ...s.lights, ambientIntensity: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">Directional</span>
                      <input
                        type="number"
                        step={0.1}
                        value={previewSettings.lights.directionalIntensity}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            lights: { ...s.lights, directionalIntensity: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['directionalX', 'directionalY', 'directionalZ'] as const).map((k) => (
                      <label key={k} className="flex flex-col gap-1">
                        <span className="text-neutral-600">{k.replace('directional', 'Dir ')}</span>
                        <input
                          type="number"
                          step={0.1}
                          value={previewSettings.lights[k]}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              lights: { ...s.lights, [k]: Number(e.target.value) } as any,
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-bold">Camera</div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <label key={axis} className="flex flex-col gap-1">
                        <span className="text-neutral-600">{axis.toUpperCase()}</span>
                        <input
                          type="number"
                          step={0.1}
                          value={previewSettings.camera[axis]}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              camera: { ...s.camera, [axis]: Number(e.target.value) } as any,
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        />
                      </label>
                    ))}
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

              <div className="space-y-4">
                <div>
                  <div className="font-bold">Material</div>
                  <label className="flex flex-col gap-1 mt-2">
                    <span className="text-neutral-600">Source</span>
                    <select
                      value={previewSettings.material.source}
                      onChange={(e) =>
                        setPreviewSettings((s) => ({
                          ...s,
                          material: { ...s.material, source: e.target.value as any },
                        }))
                      }
                      className="border border-border rounded-base px-2 py-1"
                    >
                      <option value="inline">Inline (gray standard)</option>
                      <option value="system">System material</option>
                    </select>
                  </label>

                  {previewSettings.material.source === 'system' ? (
                    <label className="flex flex-col gap-1 mt-2">
                      <span className="text-neutral-600">Material key</span>
                      {systemMaterials ? (
                        <select
                          value={previewSettings.material.systemKey}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              material: { ...s.material, systemKey: e.target.value },
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        >
                          <option value="">Select a system material…</option>
                          {systemMaterials.map((m) => (
                            <option key={m.key} value={m.key}>
                              {m.displayName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-neutral-600">Loading system materials…</div>
                      )}

                      {systemMaterialsError ? (
                        <div className="text-xs text-red-600">{systemMaterialsError}</div>
                      ) : null}

                      <div className="text-xs text-neutral-600">Or type a key manually:</div>
                      <input
                        type="text"
                        value={previewSettings.material.systemKey}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            material: { ...s.material, systemKey: e.target.value },
                          }))
                        }
                        placeholder="e.g. standardMaterial/moon"
                        className="border border-border rounded-base px-2 py-1"
                      />
                      {materialError ? <div className="text-xs text-red-600 mt-1">{materialError}</div> : null}
                      <span className="text-xs text-neutral-600 mt-1">
                        Resolved via engine resolver (active version).
                      </span>
                    </label>
                  ) : null}
                </div>

                <div>
                  <div className="font-bold">Texture Tiling</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">Repeat U</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={previewSettings.tiling.repeatU}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            tiling: { ...s.tiling, repeatU: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">Repeat V</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={previewSettings.tiling.repeatV}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            tiling: { ...s.tiling, repeatV: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">Offset U</span>
                      <input
                        type="number"
                        step={0.01}
                        value={previewSettings.tiling.offsetU}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            tiling: { ...s.tiling, offsetU: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-600">Offset V</span>
                      <input
                        type="number"
                        step={0.01}
                        value={previewSettings.tiling.offsetV}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            tiling: { ...s.tiling, offsetV: Number(e.target.value) },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      />
                    </label>
                  </div>
                  <div className="text-xs text-neutral-600 mt-1">
                    Applied via ECS TextureTilingComponent (same as runtime).
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-border">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setPreviewSettings(defaultPreviewSettings)}>
                    Reset
                  </Button>
                  <span className="text-xs text-neutral-600">Stored in localStorage</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
