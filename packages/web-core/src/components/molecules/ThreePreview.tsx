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
    const onRenderRef = React.useRef(onRender);
    const notifyRef = React.useRef(notify);
    onRenderRef.current = onRender;
    notifyRef.current = notify;

    // Handle initialization
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Cleanup existing canvases
        try {
            container.querySelectorAll('canvas').forEach((c) => c.remove());
        } catch { }

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

                // Initial resolver and scene
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
                notifyRef.current(msg, 'error');
            }
        };

        const startLoop = (renderer: ThreeRenderer) => {
            let last = performance.now();
            const tick = (t: number) => {
                if (isDisposed) return;
                const dtMs = t - last;
                last = t;

                try {
                    const currentScene = renderer.getActiveScene();
                    const isLoading = renderer.isLoading();

                    if (currentScene && !isLoading) {
                        currentScene.update(dtMs);
                    }

                    renderer.renderFrame();

                    try {
                        const input = getInputServices();
                        if (input?.mouse?.beginFrame) input.mouse.beginFrame();
                    } catch { }

                    onRenderRef.current?.(dtMs);

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

        try {
            const ro = new ResizeObserver(() => {
                try { internalRendererRef.current?.handleResize(); } catch { }
            });
            ro.observe(container);
            resizeObserverRef.current = ro;
        } catch { }

        return () => {
            isDisposed = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            try { resizeObserverRef.current?.disconnect(); } catch { }
            resizeObserverRef.current = null;
            if (renderer) {
                try { renderer.dispose(); } catch {
                    try { renderer.stop(); } catch { }
                }
            }
            internalRendererRef.current = null;
            if (externalRendererRef) externalRendererRef.current = null;
        };
    }, []); // Run once on mount

    // Handle resourceResolver updates
    React.useEffect(() => {
        if (internalRendererRef.current && resourceResolver) {
            internalRendererRef.current.setEngineResourceResolver(resourceResolver);
        }
    }, [resourceResolver]);

    // Handle scene updates
    React.useEffect(() => {
        if (internalRendererRef.current && scene) {
            internalRendererRef.current.setScene(scene);
        }
    }, [scene]);

    // Handle external ref sync
    React.useEffect(() => {
        if (externalRendererRef && internalRendererRef.current) {
            externalRendererRef.current = internalRendererRef.current;
        }
    }, [externalRendererRef]);

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
