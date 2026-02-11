'use client';

import * as React from 'react';
import * as THREE from 'three';

import { cn } from '@/lib/utils';

type Props = {
  file: File | null;
  className?: string;
  /** Called when a file is dropped onto the preview. */
  onDropFile?: (file: File) => void;
};

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded' }
  | { status: 'error'; message: string };

async function getGltfLoader() {
  // Lazy import so Jest/Next build don't eagerly parse ESM addon.
  const mod = await import('three/addons/loaders/GLTFLoader.js');
  return new mod.GLTFLoader();
}

function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const anyChild = child as any;
    if (anyChild.geometry) {
      try {
        anyChild.geometry.dispose?.();
      } catch {}
    }
    if (anyChild.material) {
      const mats = Array.isArray(anyChild.material) ? anyChild.material : [anyChild.material];
      for (const m of mats) {
        try {
          m.dispose?.();
        } catch {}
      }
    }
  });
}

function computeRadius(obj: THREE.Object3D): { center: THREE.Vector3; radius: number } {
  const box = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const radius = Math.max(size.x, size.y, size.z) * 0.5;
  return { center, radius: Number.isFinite(radius) && radius > 0 ? radius : 1 };
}

export function LocalGlbFilePreview({ file, className, onDropFile }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const rootRef = React.useRef<THREE.Object3D | null>(null);
  const loadTokenRef = React.useRef(0);
  const objectUrlRef = React.useRef<string | null>(null);

  const [state, setState] = React.useState<LoadState>({ status: 'idle' });
  const [isDragOver, setIsDragOver] = React.useState(false);

  const cleanupObjectUrl = React.useCallback(() => {
    if (!objectUrlRef.current) return;
    try {
      URL.revokeObjectURL(objectUrlRef.current);
    } catch {}
    objectUrlRef.current = null;
  }, []);

  const clearRoot = React.useCallback(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    try {
      scene.remove(root);
    } catch {}
    try {
      disposeObject3D(root);
    } catch {}
    rootRef.current = null;
  }, []);

  const handleResize = React.useCallback(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!container || !renderer || !camera) return;

    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // React 18 StrictMode can run effects twice: ensure idempotency.
    try {
      container.querySelectorAll('canvas').forEach((c) => c.remove());
    } catch {}

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0a');

    const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 5000);
    camera.position.set(0, 0, 3.25);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1.25);
    dir.position.set(2.5, 2.5, 2.5);
    scene.add(dir);

    container.appendChild(renderer.domElement);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    handleResize();

    let last = performance.now();
    const tick = (t: number) => {
      const dtMs = t - last;
      last = t;

      const root = rootRef.current;
      if (root) {
        const secs = dtMs / 1000;
        root.rotation.y += secs * 0.35;
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    try {
      const ro = new ResizeObserver(() => handleResize());
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
        clearRoot();
      } catch {}

      cleanupObjectUrl();

      try {
        renderer.dispose();
      } catch {}

      try {
        const el = renderer.domElement;
        if (el && el.parentNode) el.parentNode.removeChild(el);
      } catch {}

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [clearRoot, cleanupObjectUrl, handleResize]);

  React.useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) return;

    // Invalidate previous load.
    loadTokenRef.current += 1;
    const token = loadTokenRef.current;

    setState(file ? { status: 'loading' } : { status: 'idle' });
    clearRoot();
    cleanupObjectUrl();

    if (!file) return;

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    (async () => {
      try {
        const loader = await getGltfLoader();
        const gltf = await loader.loadAsync(url);
        if (token !== loadTokenRef.current) return;

        const root = gltf.scene || new THREE.Group();

        // Normalize materials to something readable.
        root.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          // If the asset has materials, keep them; otherwise use a default.
          if (!mesh.material) {
            mesh.material = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.6, metalness: 0.1 });
          }
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        });

        const { center, radius } = computeRadius(root);
        root.position.sub(center);

        // Fit camera.
        camera.position.set(0, 0, radius * 2.75);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        scene.add(root);
        rootRef.current = root;

        setState({ status: 'loaded' });
      } catch (e) {
        if (token !== loadTokenRef.current) return;
        const msg = e instanceof Error ? e.message : 'Failed to load GLB';
        console.error('[LocalGlbFilePreview] load failed', e);
        setState({ status: 'error', message: msg });
      }
    })();
  }, [file, clearRoot, cleanupObjectUrl]);

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

  return (
    <div className={cn('relative h-full w-full min-h-0', className)} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div ref={containerRef} className="w-full h-full min-h-0 bg-neutral-950" />

      <div className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center p-4 transition-opacity',
        isDragOver ? 'opacity-100' : 'opacity-0'
      )}>
        <div className="w-full max-w-md p-4 border-2 border-dashed border-white/60 rounded-base bg-black/40 text-white text-sm text-center">
          Drop a <strong>.glb</strong> file to preview
        </div>
      </div>

      {state.status === 'idle' ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-sm text-neutral-300 text-center">
            Drop a <strong>.glb</strong> file here (or use the file picker)
          </div>
        </div>
      ) : null}

      {state.status === 'loading' ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-sm text-neutral-300">Loading…</div>
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="max-w-lg p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
            <strong>Preview error:</strong> {state.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
