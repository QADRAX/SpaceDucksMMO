'use client';

import * as React from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import type { LayoutStorage } from 'react-resizable-panels';
import { HierarchyPanel } from './panels/HierarchyPanel';
import { ViewportCanvas } from './panels/ViewportCanvas';
import { InspectorPanel } from './panels/InspectorPanel';
import { ConsolePanel } from './panels/ConsolePanel';
import { ScriptBrowserPanel } from './panels/ScriptBrowserPanel';
import { usePluginSlot } from '../plugins/usePluginSlots';

// ─── localStorage storage adapter ──────────────────────────────────────────

const localStorageAdapter: LayoutStorage = {
    getItem: (name) => {
        try { return localStorage.getItem(`editor-layout:${name}`); }
        catch { return null; }
    },
    setItem: (name, value) => {
        try { localStorage.setItem(`editor-layout:${name}`, value); }
        catch { /* ignore in SSR / private browsing */ }
    },
};

// ─── Resize handles ────────────────────────────────────────────────────────

/** Vertical separator between left/right columns */
function ColSeparator() {
    return (
        <Separator className="group relative z-10 flex w-2 shrink-0 cursor-col-resize items-stretch justify-center">
            <div className="w-px self-stretch bg-black transition-all duration-75 group-data-[active]:w-[3px] group-data-[active]:bg-main group-hover:w-[3px] group-hover:bg-main" />
        </Separator>
    );
}

/** Horizontal separator between top/bottom rows */
function RowSeparator() {
    return (
        <Separator className="group relative z-10 flex h-2 shrink-0 cursor-row-resize flex-col items-center justify-stretch">
            <div className="h-px w-full self-stretch bg-black transition-all duration-75 group-data-[active]:h-[3px] group-data-[active]:bg-main group-hover:h-[3px] group-hover:bg-main" />
        </Separator>
    );
}

// ─── Panel shell ───────────────────────────────────────────────────────────

function PanelShell({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={[
                'flex h-full flex-col overflow-hidden border-2 border-black bg-background',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </div>
    );
}

// ─── EditorLayout ──────────────────────────────────────────────────────────

/**
 * EditorLayout — owns the resizable panel structure.
 *
 * ┌─────────────┬──────────────────────────┬────────────────┐
 * │  Hierarchy  │   Viewport 3D (main)     │   Inspector    │
 * │             ├──────────────────────────┤                │
 * │             │  Console | Scripts tabs  │                │
 * └─────────────┴──────────────────────────┴────────────────┘
 *
 * Sizes auto-saved to localStorage via useDefaultLayout.
 */
export function EditorLayout() {
    const [bottomTab, setBottomTab] = React.useState<string>('scriptBrowser');
    const bottomTabsFills = usePluginSlot('bottom-tab');

    // ── Layout persistence ───────────────────────────────────────────────

    const outerLayout = useDefaultLayout({
        id: 'editor-v2-outer',
        storage: localStorageAdapter,
        panelIds: ['hierarchy', 'centre', 'inspector'],
    });

    const centreLayout = useDefaultLayout({
        id: 'editor-v2-centre',
        storage: localStorageAdapter,
        panelIds: ['viewport-main', 'bottom'],
    });

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <Group
            id="editor-v2-outer"
            orientation="horizontal"
            className="flex-1 min-h-0"
            defaultLayout={outerLayout.defaultLayout}
            onLayoutChanged={outerLayout.onLayoutChanged}
        >
            {/* ── Left: Hierarchy ─────────────────────────────────── */}
            <Panel id="hierarchy" defaultSize={18} minSize={10}>
                <PanelShell>
                    <HierarchyPanel />
                </PanelShell>
            </Panel>

            <ColSeparator />

            {/* ── Centre: Viewport + bottom ────────────────────────── */}
            <Panel id="centre" defaultSize={55} minSize={25}>
                <Group
                    id="editor-v2-centre"
                    orientation="vertical"
                    className="h-full"
                    defaultLayout={centreLayout.defaultLayout}
                    onLayoutChanged={centreLayout.onLayoutChanged}
                >
                    {/* Viewport */}
                    <Panel id="viewport-main" defaultSize={70} minSize={30}>
                        <div className="h-full w-full overflow-hidden border-2 border-black">
                            <ViewportCanvas viewId="main" />
                        </div>
                    </Panel>

                    <RowSeparator />

                    {/* Bottom panel — tabbed */}
                    <Panel id="bottom" defaultSize={30} minSize={12}>
                        <PanelShell>
                            {/* Tab bar */}
                            <div className="flex w-full shrink-0 border-b-2 border-black overflow-x-auto scrollbar-hide">
                                {([
                                    { id: 'scriptBrowser', label: 'Scripts & Prefabs' },
                                    { id: 'console', label: 'Console' },
                                    ...bottomTabsFills.map((fill) => ({
                                        id: fill.pluginId,
                                        label: fill.tabLabel || 'Extension',
                                    })),
                                ]).map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setBottomTab(tab.id)}
                                        className={[
                                            'px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors flex-shrink-0',
                                            'border-r-2 border-black last:border-r-0',
                                            bottomTab === tab.id
                                                ? 'bg-black text-white'
                                                : 'bg-background text-black hover:bg-black/5',
                                        ].join(' ')}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab content */}
                            <div className="min-h-0 flex-1 overflow-hidden">
                                {bottomTab === 'scriptBrowser' ? (
                                    <ScriptBrowserPanel />
                                ) : bottomTab === 'console' ? (
                                    <ConsolePanel />
                                ) : (
                                    bottomTabsFills.find((f) => f.pluginId === bottomTab)?.render(null as any) ?? null
                                )}
                            </div>
                        </PanelShell>
                    </Panel>
                </Group>
            </Panel>

            <ColSeparator />

            {/* ── Right: Inspector ─────────────────────────────────── */}
            <Panel id="inspector" defaultSize={27} minSize={15}>
                <PanelShell>
                    <InspectorPanel />
                </PanelShell>
            </Panel>
        </Group>
    );
}
