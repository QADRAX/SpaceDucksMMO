'use client';

import * as React from 'react';

import {
  AmbientLightComponent,
  BaseScene,
  BasicMaterialComponent,
  CameraViewComponent,
  DirectionalLightComponent,
  Entity,
  LambertMaterialComponent,
  NoopFpsController,
  PhongMaterialComponent,
  StandardMaterialComponent,
  ThreeRenderer,
  createWebCoreEngineResourceResolver,
  type GameSettings,
  type ISettingsService,
} from '@duckengine/rendering-three';

import { getInputServices } from '@duckengine/rendering-three/ecs';

import {
  BoxGeometryComponent,
  CustomGeometryComponent,
  ConeGeometryComponent,
  CylinderGeometryComponent,
  PlaneGeometryComponent,
  SphereGeometryComponent,
  TextureTilingComponent,
  TorusGeometryComponent,
} from '@duckengine/ecs';

import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { cn } from '@/lib/utils';

import type { MaterialResourceKind } from '@/lib/types';

type MaterialComponentData = Record<string, unknown>;

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

type GeometryType =
  | 'sphereGeometry'
  | 'boxGeometry'
  | 'planeGeometry'
  | 'cylinderGeometry'
  | 'coneGeometry'
  | 'torusGeometry'
  | 'customMesh';

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
    speed: number; // radians/sec
    axis: 'x' | 'y' | 'z';
  };
  geometry: {
    type: GeometryType;
    customMesh: {
      key: string;
    };
    sphere: {
      radius: number;
      widthSegments: number;
      heightSegments: number;
    };
    box: {
      width: number;
      height: number;
      depth: number;
    };
    plane: {
      width: number;
      height: number;
      widthSegments: number;
      heightSegments: number;
    };
    cylinder: {
      radiusTop: number;
      radiusBottom: number;
      height: number;
      radialSegments: number;
    };
    cone: {
      radius: number;
      height: number;
      radialSegments: number;
    };
    torus: {
      radius: number;
      tube: number;
      radialSegments: number;
      tubularSegments: number;
    };
  };
};

function getPreviewStorageKey(resourceKey: string): string {
  const normalized = resourceKey.trim() || 'draft';
  return `webcore.preview.material.${normalized}.v1`;
}

function getPreviewSettingsEvent(resourceKey: string): string {
  const normalized = resourceKey.trim() || 'draft';
  return `webcore:previewSettingsChanged:material:${normalized}`;
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

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function safeParseSettings(raw: unknown): PreviewSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  // Lightweight validation/merge; keeps forward-compat without strict schemas.
  const r = raw as any;
  const merged: PreviewSettings = {
    ...defaultPreviewSettings,
    camera: { ...defaultPreviewSettings.camera, ...(r.camera ?? {}) },
    tiling: { ...defaultPreviewSettings.tiling, ...(r.tiling ?? {}) },
    lights: { ...defaultPreviewSettings.lights, ...(r.lights ?? {}) },
    rotation: { ...defaultPreviewSettings.rotation, ...(r.rotation ?? {}) },
    geometry: { ...defaultPreviewSettings.geometry, ...(r.geometry ?? {}) },
  };

  merged.geometry.customMesh = {
    ...defaultPreviewSettings.geometry.customMesh,
    ...((r.geometry?.customMesh as any) ?? {}),
  };

  merged.tiling.repeatU = clampNumber(merged.tiling.repeatU, 0, 100);
  merged.tiling.repeatV = clampNumber(merged.tiling.repeatV, 0, 100);
  merged.tiling.offsetU = clampNumber(merged.tiling.offsetU, -100, 100);
  merged.tiling.offsetV = clampNumber(merged.tiling.offsetV, -100, 100);

  // Clamp a few values to avoid weird rendering states.
  merged.camera.z = clampNumber(merged.camera.z, 0.25, 50);
  merged.lights.ambientIntensity = clampNumber(merged.lights.ambientIntensity, 0, 10);
  merged.lights.directionalIntensity = clampNumber(merged.lights.directionalIntensity, 0, 20);
  merged.rotation.speed = clampNumber(merged.rotation.speed, 0, 10);

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

function createMaterialComponent(kind: MaterialResourceKind, data: MaterialComponentData) {
  switch (kind) {
    case 'basicMaterial':
      return new BasicMaterialComponent(data as any);
    case 'lambertMaterial':
      return new LambertMaterialComponent(data as any);
    case 'phongMaterial':
      return new PhongMaterialComponent(data as any);
    case 'standardMaterial':
      return new StandardMaterialComponent(data as any);
    default:
      return new StandardMaterialComponent(data as any);
  }
}

function createGeometryComponent(settings: PreviewSettings) {
  switch (settings.geometry.type) {
    case 'customMesh': {
      const key = String(settings.geometry.customMesh?.key ?? '').trim();
      if (!key) return new SphereGeometryComponent({ radius: 1 } as any);
      return new CustomGeometryComponent({ key });
    }
    case 'sphereGeometry':
      return new SphereGeometryComponent({
        radius: settings.geometry.sphere.radius,
        widthSegments: settings.geometry.sphere.widthSegments,
        heightSegments: settings.geometry.sphere.heightSegments,
      } as any);
    case 'boxGeometry':
      return new BoxGeometryComponent({
        width: settings.geometry.box.width,
        height: settings.geometry.box.height,
        depth: settings.geometry.box.depth,
      } as any);
    case 'planeGeometry':
      return new PlaneGeometryComponent({
        width: settings.geometry.plane.width,
        height: settings.geometry.plane.height,
        widthSegments: settings.geometry.plane.widthSegments,
        heightSegments: settings.geometry.plane.heightSegments,
      } as any);
    case 'cylinderGeometry':
      return new CylinderGeometryComponent({
        radiusTop: settings.geometry.cylinder.radiusTop,
        radiusBottom: settings.geometry.cylinder.radiusBottom,
        height: settings.geometry.cylinder.height,
        radialSegments: settings.geometry.cylinder.radialSegments,
      } as any);
    case 'coneGeometry':
      return new ConeGeometryComponent({
        radius: settings.geometry.cone.radius,
        height: settings.geometry.cone.height,
        radialSegments: settings.geometry.cone.radialSegments,
      } as any);
    case 'torusGeometry':
      return new TorusGeometryComponent({
        radius: settings.geometry.torus.radius,
        tube: settings.geometry.torus.tube,
        radialSegments: settings.geometry.torus.radialSegments,
        tubularSegments: settings.geometry.torus.tubularSegments,
      } as any);
    default:
      return new SphereGeometryComponent({ radius: 1 } as any);
  }
}

class MaterialPreviewScene extends BaseScene {
  readonly id = 'admin-material-preview';

  private mesh?: Entity;
  private camera?: Entity;
  private ambient?: Entity;
  private dir?: Entity;
  private previewSettings: PreviewSettings = defaultPreviewSettings;
  private currentMaterialKind: MaterialResourceKind;
  private currentMaterialData: MaterialComponentData;

  constructor(
    settings: ISettingsService,
    private readonly kind: MaterialResourceKind,
    private readonly initialComponentData: MaterialComponentData,
    previewSettings: PreviewSettings
  ) {
    super(settings);
    this.previewSettings = previewSettings;
    this.currentMaterialKind = kind;
    this.currentMaterialData = initialComponentData;
  }

  setup(engine: any, renderScene: any): void {
    super.setup(engine, renderScene);

    // Camera
    this.camera = new Entity('camera', [0, 0, 3.25]);
    this.camera.addComponent(
      new CameraViewComponent({
        fov: 55,
        near: 0.1,
        far: 1000,
        aspect: 1,
      })
    );
    this.addEntity(this.camera);
    this.setActiveCamera(this.camera.id);

    // Lights
    this.ambient = new Entity('ambient');
    this.ambient.addComponent(new AmbientLightComponent({ intensity: 0.9 } as any));
    this.addEntity(this.ambient);

    this.dir = new Entity('dirLight', [2.5, 2.5, 2.5]);
    this.dir.addComponent(new DirectionalLightComponent({ intensity: 1.25 } as any));
    this.addEntity(this.dir);

    // Mesh
    this.mesh = new Entity('mesh');
    this.mesh.addComponent(createGeometryComponent(this.previewSettings));
    this.mesh.addComponent(createMaterialComponent(this.kind, this.initialComponentData));
    // Apply tiling via ECS so it matches real runtime behavior.
    this.mesh.addComponent(
      new TextureTilingComponent({
        repeatU: this.previewSettings.tiling.repeatU,
        repeatV: this.previewSettings.tiling.repeatV,
        offsetU: this.previewSettings.tiling.offsetU,
        offsetV: this.previewSettings.tiling.offsetV,
      } as any)
    );
    this.addEntity(this.mesh);

    this.applyPreviewSettings(this.previewSettings);
  }

  applyPreviewSettings(next: PreviewSettings) {
    this.previewSettings = next;

    if (this.camera) {
      this.camera.transform.setPosition(next.camera.x, next.camera.y, next.camera.z);
      this.camera.transform.lookAt({ x: 0, y: 0, z: 0 });
    }

    if (this.ambient) {
      const c = this.ambient.getComponent<any>('ambientLight');
      if (c) c.intensity = next.lights.ambientIntensity;
    }

    if (this.dir) {
      this.dir.transform.setPosition(next.lights.directionalX, next.lights.directionalY, next.lights.directionalZ);
      const c = this.dir.getComponent<any>('directionalLight');
      if (c) c.intensity = next.lights.directionalIntensity;
    }

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

    this.setGeometry(next);
  }

  setMaterial(kind: MaterialResourceKind, componentData: MaterialComponentData) {
    if (!this.mesh) return;

    this.currentMaterialKind = kind;
    this.currentMaterialData = componentData;

    // Remove any previous material component.
    this.removeMaterialComponents();

    this.mesh.addComponent(createMaterialComponent(kind, componentData));
  }

  private removeMaterialComponents() {
    if (!this.mesh) return;
    const materialTypes = ['basicMaterial', 'lambertMaterial', 'phongMaterial', 'standardMaterial'];
    for (const t of materialTypes) {
      if (this.mesh.hasComponent(t)) {
        this.mesh.removeComponent(t);
      }
    }
  }

  private setGeometry(next: PreviewSettings) {
    if (!this.mesh) return;

    // Respect ECS constraints: materials require geometry.
    // Swap order: remove material -> remove geometry -> add geometry -> re-add material.
    const materialKind = this.currentMaterialKind;
    const materialData = this.currentMaterialData;
    this.removeMaterialComponents();

    const geometryTypes: GeometryType[] = [
      'sphereGeometry',
      'boxGeometry',
      'planeGeometry',
      'cylinderGeometry',
      'coneGeometry',
      'torusGeometry',
      'customMesh',
    ];
    for (const t of geometryTypes) {
      if (this.mesh.hasComponent(t)) {
        this.mesh.removeComponent(t);
      }
    }
    if (this.mesh.hasComponent('customGeometry')) {
      this.mesh.removeComponent('customGeometry');
    }
    this.mesh.addComponent(createGeometryComponent(next));

    // Restore the material after geometry exists.
    this.mesh.addComponent(createMaterialComponent(materialKind, materialData));
  }

  update(dt: number): void {
    super.update(dt);

    if (!this.mesh) return;

    if (!this.previewSettings.rotation.enabled) return;

    // Slow spin for better texture perception.
    const secs = dt / 1000;
    const speed = this.previewSettings.rotation.speed;
    const r = this.mesh.transform.localRotation;
    const delta = secs * speed;

    switch (this.previewSettings.rotation.axis) {
      case 'x':
        this.mesh.transform.setRotation(r.x + delta, r.y, r.z);
        break;
      case 'z':
        this.mesh.transform.setRotation(r.x, r.y, r.z + delta);
        break;
      case 'y':
      default:
        this.mesh.transform.setRotation(r.x, r.y + delta, r.z);
        break;
    }
  }
}

export function MaterialResourcePreview({ resourceKey, kind, componentData, className }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rendererRef = React.useRef<ThreeRenderer | null>(null);
  const sceneRef = React.useRef<MaterialPreviewScene | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [previewSettings, setPreviewSettings] = React.useState<PreviewSettings>(() => loadPreviewSettings(resourceKey));
  const lastPersistedJsonRef = React.useRef<string | null>(null);

  const [systemMeshes, setSystemMeshes] = React.useState<ResourceListItem[] | null>(null);
  const [systemMeshesError, setSystemMeshesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPreviewSettings(loadPreviewSettings(resourceKey));
    lastPersistedJsonRef.current = null;
  }, [resourceKey]);

  React.useEffect(() => {
    if (!settingsOpen) return;
    if (previewSettings.geometry.type !== 'customMesh') return;
    if (systemMeshes) return;

    let cancelled = false;
    (async () => {
      try {
        setSystemMeshesError(null);
        const res = await fetch('/api/admin/resources?kind=customMesh');
        if (!res.ok) throw new Error(`Failed to list system meshes (${res.status})`);
        const json = (await res.json()) as any;
        const data = Array.isArray(json?.data) ? (json.data as ResourceListItem[]) : [];
        const normalized = data
          .filter((r) => r && typeof r.key === 'string')
          .map((r) => ({
            id: String((r as any).id ?? r.key),
            key: String((r as any).key ?? ''),
            displayName: String((r as any).displayName ?? (r as any).key ?? ''),
            kind: String((r as any).kind ?? ''),
          }));
        if (cancelled) return;
        setSystemMeshes(normalized);
      } catch (e) {
        if (cancelled) return;
        setSystemMeshesError(e instanceof Error ? e.message : 'Failed to load system meshes');
        setSystemMeshes([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [settingsOpen, previewSettings.geometry.type, systemMeshes]);

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

    // In React 18 StrictMode (Next dev), effects can run twice.
    // Make preview idempotent by removing any existing canvases.
    try {
      container.querySelectorAll('canvas').forEach((c) => c.remove());
    } catch {
      // ignore
    }

    let renderer: ThreeRenderer;
    let scene: MaterialPreviewScene;
    try {
      const fps = new NoopFpsController();
      renderer = new ThreeRenderer(fps);
      renderer.init(container);

      // Needed for CustomGeometryComponent (system mesh) preview.
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      renderer.setEngineResourceResolver(createWebCoreEngineResourceResolver({ baseUrl }));

      const settings = new InlineSettingsService();
      scene = new MaterialPreviewScene(settings, kind, componentData, previewSettings);
      renderer.setScene(scene);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to initialize preview';
      console.error('[MaterialResourcePreview] init failed', e);
      setError(msg);
      return;
    }

    rendererRef.current = renderer;
    sceneRef.current = scene;

    let last = performance.now();

    // Ensure initial sizing after layout.
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

        // Mirror client wiring: finalize input frame (if present).
        try {
          const input = getInputServices();
          if (input?.mouse?.beginFrame) input.mouse.beginFrame();
        } catch {
          // ignore
        }
      } catch (e) {
        console.error('[MaterialResourcePreview] render failed', e);
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
      // ResizeObserver not available; window resize handler still exists inside renderer.
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
        // Best-effort cleanup
        (renderer as any).dispose?.();
        renderer.stop();
      } catch {
        // ignore
      }

      // Renderer attaches window resize listener; not exposed for removal.
      // Preview is short-lived; ok.
      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    sceneRef.current?.setMaterial(kind, componentData);
  }, [kind, componentData]);

  return (
    <div className={cn('h-full w-full min-h-0', className)}>
      <div className="relative h-full w-full min-h-0">
        <div ref={containerRef} className="w-full h-full min-h-0 bg-neutral-950" />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setSettingsOpen((v) => !v)}
          >
            Preview settings
          </Button>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="p-0 w-full max-w-2xl">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl font-heading">Preview settings</div>
                <div className="text-sm text-neutral-600 mt-1">
                  Saved locally per material resource
                </div>
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
                    <label className="flex items-center gap-2">
                      <span className="text-neutral-600">Axis</span>
                      <select
                        value={previewSettings.rotation.axis}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            rotation: { ...s.rotation, axis: e.target.value as any },
                          }))
                        }
                        className="border border-border rounded-base px-2 py-1"
                      >
                        <option value="x">X</option>
                        <option value="y">Y</option>
                        <option value="z">Z</option>
                      </select>
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
                    Applies to all material maps, including system custom meshes.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="font-bold">Geometry</div>
                  <label className="flex flex-col gap-1 mt-2">
                    <span className="text-neutral-600">Type</span>
                    <select
                      value={previewSettings.geometry.type}
                      onChange={(e) =>
                        setPreviewSettings((s) => ({
                          ...s,
                          geometry: { ...s.geometry, type: e.target.value as GeometryType },
                        }))
                      }
                      className="border border-border rounded-base px-2 py-1"
                    >
                      <option value="sphereGeometry">Sphere</option>
                      <option value="boxGeometry">Box</option>
                      <option value="planeGeometry">Plane</option>
                      <option value="cylinderGeometry">Cylinder</option>
                      <option value="coneGeometry">Cone</option>
                      <option value="torusGeometry">Torus</option>
                      <option value="customMesh">System mesh</option>
                    </select>
                  </label>

                  {previewSettings.geometry.type === 'customMesh' ? (
                    <label className="flex flex-col gap-1 mt-2">
                      <span className="text-neutral-600">Mesh key</span>
                      {systemMeshes ? (
                        <select
                          value={previewSettings.geometry.customMesh.key}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              geometry: {
                                ...s.geometry,
                                customMesh: { ...s.geometry.customMesh, key: e.target.value },
                              },
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        >
                          <option value="">Select a system mesh…</option>
                          {systemMeshes.map((m) => (
                            <option key={m.key} value={m.key}>
                              {m.displayName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-neutral-600">Loading system meshes…</div>
                      )}

                      {systemMeshesError ? <div className="text-xs text-red-600">{systemMeshesError}</div> : null}

                      <div className="text-xs text-neutral-600">Or type a key manually:</div>
                      <input
                        type="text"
                        value={previewSettings.geometry.customMesh.key}
                        onChange={(e) =>
                          setPreviewSettings((s) => ({
                            ...s,
                            geometry: {
                              ...s.geometry,
                              customMesh: { ...s.geometry.customMesh, key: e.target.value },
                            },
                          }))
                        }
                        placeholder="e.g. meshes/ship/glider"
                        className="border border-border rounded-base px-2 py-1"
                      />
                      <span className="text-xs text-neutral-600 mt-1">
                        Uses a system custom mesh (customMesh resource) via resolver.
                      </span>
                    </label>
                  ) : null}

                  {/* Params per geometry */}
                  {previewSettings.geometry.type === 'sphereGeometry' ? (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-neutral-600">Radius</span>
                        <input
                          type="number"
                          step={0.1}
                          value={previewSettings.geometry.sphere.radius}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              geometry: {
                                ...s.geometry,
                                sphere: { ...s.geometry.sphere, radius: Number(e.target.value) },
                              },
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-neutral-600">W seg</span>
                        <input
                          type="number"
                          step={1}
                          value={previewSettings.geometry.sphere.widthSegments}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              geometry: {
                                ...s.geometry,
                                sphere: {
                                  ...s.geometry.sphere,
                                  widthSegments: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-neutral-600">H seg</span>
                        <input
                          type="number"
                          step={1}
                          value={previewSettings.geometry.sphere.heightSegments}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              geometry: {
                                ...s.geometry,
                                sphere: {
                                  ...s.geometry.sphere,
                                  heightSegments: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        />
                      </label>
                    </div>
                  ) : null}

                  {previewSettings.geometry.type === 'boxGeometry' ? (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(['width', 'height', 'depth'] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-1">
                          <span className="text-neutral-600">{k}</span>
                          <input
                            type="number"
                            step={0.1}
                            value={previewSettings.geometry.box[k]}
                            onChange={(e) =>
                              setPreviewSettings((s) => ({
                                ...s,
                                geometry: {
                                  ...s.geometry,
                                  box: { ...s.geometry.box, [k]: Number(e.target.value) } as any,
                                },
                              }))
                            }
                            className="border border-border rounded-base px-2 py-1"
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {previewSettings.geometry.type === 'planeGeometry' ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(['width', 'height'] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-1">
                          <span className="text-neutral-600">{k}</span>
                          <input
                            type="number"
                            step={0.1}
                            value={previewSettings.geometry.plane[k]}
                            onChange={(e) =>
                              setPreviewSettings((s) => ({
                                ...s,
                                geometry: {
                                  ...s.geometry,
                                  plane: { ...s.geometry.plane, [k]: Number(e.target.value) } as any,
                                },
                              }))
                            }
                            className="border border-border rounded-base px-2 py-1"
                          />
                        </label>
                      ))}
                      {(['widthSegments', 'heightSegments'] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-1">
                          <span className="text-neutral-600">{k}</span>
                          <input
                            type="number"
                            step={1}
                            value={previewSettings.geometry.plane[k]}
                            onChange={(e) =>
                              setPreviewSettings((s) => ({
                                ...s,
                                geometry: {
                                  ...s.geometry,
                                  plane: { ...s.geometry.plane, [k]: Number(e.target.value) } as any,
                                },
                              }))
                            }
                            className="border border-border rounded-base px-2 py-1"
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {previewSettings.geometry.type === 'cylinderGeometry' ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(['radiusTop', 'radiusBottom', 'height'] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-1">
                          <span className="text-neutral-600">{k}</span>
                          <input
                            type="number"
                            step={0.1}
                            value={previewSettings.geometry.cylinder[k] as any}
                            onChange={(e) =>
                              setPreviewSettings((s) => ({
                                ...s,
                                geometry: {
                                  ...s.geometry,
                                  cylinder: { ...s.geometry.cylinder, [k]: Number(e.target.value) } as any,
                                },
                              }))
                            }
                            className="border border-border rounded-base px-2 py-1"
                          />
                        </label>
                      ))}
                      <label className="flex flex-col gap-1">
                        <span className="text-neutral-600">radialSegments</span>
                        <input
                          type="number"
                          step={1}
                          value={previewSettings.geometry.cylinder.radialSegments}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              geometry: {
                                ...s.geometry,
                                cylinder: { ...s.geometry.cylinder, radialSegments: Number(e.target.value) },
                              },
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        />
                      </label>
                    </div>
                  ) : null}

                  {previewSettings.geometry.type === 'coneGeometry' ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(['radius', 'height'] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-1">
                          <span className="text-neutral-600">{k}</span>
                          <input
                            type="number"
                            step={0.1}
                            value={previewSettings.geometry.cone[k]}
                            onChange={(e) =>
                              setPreviewSettings((s) => ({
                                ...s,
                                geometry: {
                                  ...s.geometry,
                                  cone: { ...s.geometry.cone, [k]: Number(e.target.value) } as any,
                                },
                              }))
                            }
                            className="border border-border rounded-base px-2 py-1"
                          />
                        </label>
                      ))}
                      <label className="flex flex-col gap-1">
                        <span className="text-neutral-600">radialSegments</span>
                        <input
                          type="number"
                          step={1}
                          value={previewSettings.geometry.cone.radialSegments}
                          onChange={(e) =>
                            setPreviewSettings((s) => ({
                              ...s,
                              geometry: {
                                ...s.geometry,
                                cone: { ...s.geometry.cone, radialSegments: Number(e.target.value) },
                              },
                            }))
                          }
                          className="border border-border rounded-base px-2 py-1"
                        />
                      </label>
                    </div>
                  ) : null}

                  {previewSettings.geometry.type === 'torusGeometry' ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(['radius', 'tube'] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-1">
                          <span className="text-neutral-600">{k}</span>
                          <input
                            type="number"
                            step={0.05}
                            value={previewSettings.geometry.torus[k]}
                            onChange={(e) =>
                              setPreviewSettings((s) => ({
                                ...s,
                                geometry: {
                                  ...s.geometry,
                                  torus: { ...s.geometry.torus, [k]: Number(e.target.value) } as any,
                                },
                              }))
                            }
                            className="border border-border rounded-base px-2 py-1"
                          />
                        </label>
                      ))}
                      {(['radialSegments', 'tubularSegments'] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-1">
                          <span className="text-neutral-600">{k}</span>
                          <input
                            type="number"
                            step={1}
                            value={previewSettings.geometry.torus[k]}
                            onChange={(e) =>
                              setPreviewSettings((s) => ({
                                ...s,
                                geometry: {
                                  ...s.geometry,
                                  torus: { ...s.geometry.torus, [k]: Number(e.target.value) } as any,
                                },
                              }))
                            }
                            className="border border-border rounded-base px-2 py-1"
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-border">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreviewSettings(defaultPreviewSettings)}
                  >
                    Reset
                  </Button>
                  <span className="text-xs text-neutral-600">Stored in localStorage</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {error ? (
        <div className="mt-2 text-xs text-red-600">
          Preview error: {error}
        </div>
      ) : null}
    </div>
  );
}
