'use client';

import * as React from 'react';
import {
    BaseScene,
    NoopFpsController,
    ThreeRenderer,
    createWebCoreEngineResourceResolver,
    type EngineResourceResolver,
} from '@duckengine/rendering-three';
import { getInputServices } from '@duckengine/rendering-three/ecs';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';

type Props = {
    /** The scene to render. Must inherit from BaseScene. */
    scene: BaseScene | null;
    /** Optional custom resource resolver. If not provided, uses default WebCore resolver. */
    resourceResolver?: EngineResourceResolver;
    /** Class name for the container. */
    className?: string;
    /** Optional callback invoked on every frame. */
    onRender?: (dt: number) => void;
    /** Optional ref to access the renderer instance. */
    rendererRef?: React.MutableRefObject<ThreeRenderer | null>;
    /** Optional error state to display. */
    error?: string | null;
    /** Optional children (e.g. UI overlays). */
    children?: React.ReactNode;
};

export function ThreePreview({
    scene,
    resourceResolver,
    className,
    onRender,
    rendererRef: externalRendererRef,
    error: externalError,
    children,
}: Props) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const internalRendererRef = React.useRef<ThreeRenderer | null>(null);
    const rafRef = React.useRef<number | null>(null);
    const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
    const { notify } = useNotifications();

    // Handle initialization and lifecycle
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Cleanup existing canvases (idempotency)
        try {
            container.querySelectorAll('canvas').forEach((c) => c.remove());
        } catch {
            // ignore
        }

        let renderer: ThreeRenderer | undefined;
        let isDisposed = false;

        const initRenderer = async () => {
            try {
                const fps = new NoopFpsController();
                renderer = new ThreeRenderer(fps);
                await renderer.init(container);

                if (isDisposed) {
                    renderer.dispose();
                    return;
                }

                // Setup resolver
                if (resourceResolver) {
                    renderer.setEngineResourceResolver(resourceResolver);
                } else {
                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                    renderer.setEngineResourceResolver(createWebCoreEngineResourceResolver({ baseUrl }));
                }

                if (scene) {
                    renderer.setScene(scene);
                }

                internalRendererRef.current = renderer;
                if (externalRendererRef) externalRendererRef.current = renderer;

                startLoop(renderer);

                // Initial resize
                requestAnimationFrame(() => {
                    try { renderer?.handleResize(); } catch { }
                });

            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Failed to initialize preview';
                console.error('[ThreePreview] init failed', e);
                notify(msg, 'error');
            }
        };

        // Animation Loop
        const startLoop = (renderer: ThreeRenderer) => {
            let last = performance.now();
            const tick = (t: number) => {
                if (isDisposed) return;

                const dtMs = t - last;
                last = t;

                try {
                    const isLoading = renderer.isLoading();

                    if (scene && !isLoading) {
                        scene.update(dtMs);
                    }

                    renderer.renderFrame();

                    // Standard input processing
                    try {
                        const input = getInputServices();
                        if (input?.mouse?.beginFrame) input.mouse.beginFrame();
                    } catch {
                        // ignore
                    }

                    onRender?.(dtMs);

                } catch (e) {
                    console.error('[ThreePreview] render failed', e);
                    if (rafRef.current) cancelAnimationFrame(rafRef.current);
                    renderer.stop();
                    return;
                }

                rafRef.current = requestAnimationFrame(tick);
            };

            rafRef.current = requestAnimationFrame(tick);
        };

        initRenderer();

        // Resize Observer
        try {
            const ro = new ResizeObserver(() => {
                try {
                    internalRendererRef.current?.handleResize();
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
            isDisposed = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;

            try {
                resizeObserverRef.current?.disconnect();
            } catch { }
            resizeObserverRef.current = null;

            if (renderer) {
                try {
                    renderer.dispose();
                } catch {
                    try { renderer.stop(); } catch { }
                }
            }

            internalRendererRef.current = null;
            if (externalRendererRef) externalRendererRef.current = null;
        };
    }, [scene, resourceResolver, externalRendererRef, notify, onRender]);

    return (
        <div className={cn('relative h-full w-full min-h-0', className)}>
            <div ref={containerRef} className="w-full h-full min-h-0 bg-neutral-950" />

            {externalError ? (
                <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                    <div className="max-w-lg p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm pointer-events-auto">
                        <strong>Error:</strong> {externalError}
                    </div>
                </div>
            ) : null}

            {children}
        </div>
    );
}
