'use client';

import * as React from 'react';

import {
  NoopFpsController,
  ThreeRenderer,
  createWebCoreEngineResourceResolver,
} from '@duckengine/rendering-three';

import { getInputServices, setInputServices } from '@duckengine/rendering-three/ecs';

import type { EcsEditorScene } from '../logic/EcsEditorScene';
import { createEditorInputServices, type EditorInputServices } from '../logic/editorInputServices';

function devWarn(scope: string, message: string, err?: unknown) {
  if (process.env.NODE_ENV === 'production') return;
  if (err) {
    console.warn(`[${scope}] ${message}`, err);
  } else {
    console.warn(`[${scope}] ${message}`);
  }
}

export function useThreeRendererLoop(args: {
  containerRef: React.RefObject<HTMLDivElement>;
  rendererRef: React.MutableRefObject<ThreeRenderer | null>;
  getFrame: () => { scene: EcsEditorScene | null; paused: boolean };
  onInit: () => void;
  onCapturePose: (scene: EcsEditorScene) => void;
  onError: (msg: string) => void;
}) {
  const rafRef = React.useRef<number | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const inputRef = React.useRef<ReturnType<typeof createEditorInputServices> | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const input = createEditorInputServices();
    inputRef.current = input;

    // default: do NOT capture keyboard unless viewport is active
    try {
      input.keyboard.setEnabled(false);
    } catch (e) {
      devWarn('SceneEditor', 'Failed to disable keyboard capture', e);
    }

    setInputServices({ mouse: input.mouse, keyboard: input.keyboard });
    input.keyboard.onKeyDown('escape', () => {
      try {
        input.mouse.exitPointerLock();
      } catch (e) {
        devWarn('EcsTreeEditor', 'exitPointerLock failed', e);
      }
      try {
        input.keyboard.setEnabled(false);
      } catch (e) {
        devWarn('EcsTreeEditor', 'Failed to disable keyboard capture on escape', e);
      }
    });

    return () => {
      try {
        input.dispose();
      } catch (e) {
        devWarn('EcsTreeEditor', 'Input dispose failed', e);
      }

      inputRef.current = null;

      try {
        setInputServices(null);
      } catch (e) {
        devWarn('EcsTreeEditor', 'Failed to clear input services', e);
      }
    };
  }, []);

  React.useEffect(() => {
    let container = args.containerRef.current;
    if (!container) {
      // One retry on next microtask/frame: helps avoid a "ref not set yet" edge.
      const id = requestAnimationFrame(() => {
        container = args.containerRef.current;
        if (!container) return;
      });
      cancelAnimationFrame(id);
      container = args.containerRef.current;
      if (!container) return;
    }

    args.onError('');

    // StrictMode dev: effects can run twice; make idempotent.
    container.querySelectorAll('canvas').forEach((c) => c.remove());

    const renderer = new ThreeRenderer(new NoopFpsController() as any);
    renderer.init(container);

    try {
      const baseUrl = window.location.origin;
      renderer.setEngineResourceResolver(createWebCoreEngineResourceResolver({ baseUrl }));
    } catch (e) {
      devWarn('EcsTreeEditor', 'Failed to set resource resolver', e);
    }

    args.rendererRef.current = renderer;

    // Wire canvas to mouse service
    let canvasClickHandler: (() => void) | null = null;
    let canvasFocusHandler: ((e: FocusEvent) => void) | null = null;
    let canvasBlurHandler: ((e: FocusEvent) => void) | null = null;
    let pointerLockChangeHandler: (() => void) | null = null;
    let windowBlurHandler: (() => void) | null = null;

    const setKeyboardEnabled = (v: boolean) => {
      const input = inputRef.current;
      if (!input) return;
      try {
        input.keyboard.setEnabled(v);
      } catch (e) {
        devWarn('EcsTreeEditor', `keyboard.setEnabled(${String(v)}) failed`, e);
      }
    };

    const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas) {
      // allow focus-based capture without pointer lock
      try {
        canvas.tabIndex = 0;
      } catch {
        // ignore
      }

      const input = getInputServices();
      if (input?.mouse) {
        try {
          input.mouse.setTargetElement(canvas);
        } catch (e) {
          devWarn('EcsTreeEditor', 'Failed to set mouse target element', e);
        }
        canvasClickHandler = () => {
          // Clicking viewport should "activate" the editor controls.
          try {
            canvas.focus();
          } catch {
            // ignore
          }
          setKeyboardEnabled(true);
          try {
            input.mouse.requestPointerLock();
          } catch (e) {
            devWarn('EcsTreeEditor', 'Pointer lock request failed', e);
          }
        };
        canvas.addEventListener('click', canvasClickHandler);
      }

      canvasFocusHandler = () => setKeyboardEnabled(true);
      canvasBlurHandler = () => setKeyboardEnabled(false);
      canvas.addEventListener('focus', canvasFocusHandler);
      canvas.addEventListener('blur', canvasBlurHandler);

      pointerLockChangeHandler = () => {
        try {
          const locked = !!(document && (document as any).pointerLockElement);
          setKeyboardEnabled(locked);
        } catch (e) {
          devWarn('EcsTreeEditor', 'pointerlockchange handler failed', e);
          setKeyboardEnabled(false);
        }
      };
      try {
        document.addEventListener('pointerlockchange', pointerLockChangeHandler);
      } catch (e) {
        devWarn('EcsTreeEditor', 'Failed to attach pointerlockchange handler', e);
      }

      windowBlurHandler = () => setKeyboardEnabled(false);
      try {
        window.addEventListener('blur', windowBlurHandler);
      } catch (e) {
        devWarn('EcsTreeEditor', 'Failed to attach window blur handler', e);
      }
    }

    try {
      args.onInit();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to initialize editor';
      args.onError(msg);
    }

    let last = performance.now();

    const tick = (t: number) => {
      const dtMs = t - last;
      last = t;

      try {
        const { scene, paused } = args.getFrame();

        if (scene) {
          args.onCapturePose(scene);
          // If the engine is in its initial loading phase, it will handle update(0) internally
          // during renderFrame() to allow for discovery without advancing simulation.
          const isLoading = (renderer as any).isLoading?.() ?? false;
          if (!isLoading) {
            scene.update(dtMs, { paused });
          }
        }

        renderer.renderFrame();

        const input = getInputServices();
        if (input?.mouse?.beginFrame) {
          try {
            input.mouse.beginFrame();
          } catch (e) {
            devWarn('EcsTreeEditor', 'mouse.beginFrame failed', e);
          }
        }
      } catch (e) {
        console.error('[EcsTreeEditor] render failed', e);
        args.onError(e instanceof Error ? e.message : 'Editor render failed');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        try {
          renderer.handleResize();
        } catch (e) {
          devWarn('EcsTreeEditor', 'renderer.handleResize failed', e);
        }
      });
      ro.observe(container);
      resizeObserverRef.current = ro;
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      const canvas = (container?.querySelector('canvas') ?? null) as HTMLCanvasElement | null;
      if (canvas && canvasClickHandler) canvas.removeEventListener('click', canvasClickHandler);
      if (canvas && canvasFocusHandler) canvas.removeEventListener('focus', canvasFocusHandler);
      if (canvas && canvasBlurHandler) canvas.removeEventListener('blur', canvasBlurHandler);

      if (pointerLockChangeHandler) {
        try {
          document.removeEventListener('pointerlockchange', pointerLockChangeHandler);
        } catch (e) {
          devWarn('EcsTreeEditor', 'Failed to detach pointerlockchange handler', e);
        }
      }

      if (windowBlurHandler) {
        try {
          window.removeEventListener('blur', windowBlurHandler);
        } catch (e) {
          devWarn('EcsTreeEditor', 'Failed to detach window blur handler', e);
        }
      }

      // ensure keyboard is released when editor unmounts
      setKeyboardEnabled(false);

      try {
        renderer.dispose?.();
        renderer.stop?.();
      } catch (e) {
        devWarn('EcsTreeEditor', 'Renderer cleanup failed', e);
      }
      args.rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
