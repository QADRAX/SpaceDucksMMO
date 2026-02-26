/**
 * pluginTypes.ts — Web-core extension of the core plugin system.
 *
 * Re-exports platform-agnostic types from @duckengine/core, then adds
 * the React-specific layer: EditorSlotId, EditorSlotFill, EditorPlugin
 * (with slotFills), and EditorPluginRegistry (with getSlotFills).
 *
 * Always import from this file inside SceneEditorV2 — not from @duckengine/core directly.
 */

import type * as React from 'react';

// Re-export all platform-agnostic plugin types from core
export type {
    EditorPluginConfigValue,
    EditorPluginConfigField,
    EditorPluginCategory,
    EditorPluginSource,
    EditorPluginMeta,
    EditorPluginContext,
    IEditorPlugin,
    IEditorPluginRegistry,
    IEditorPluginLoader,
} from '@duckengine/core';

import type {
    EditorPluginContext,
    IEditorPlugin,
    IEditorPluginRegistry,
} from '@duckengine/core';

// ─── Named Slot IDs ────────────────────────────────────────────────────────

export type EditorSlotId =
    | 'toolbar.debug-actions'        // icon buttons right of Save in the toolbar
    | 'hierarchy.header-actions'     // icon buttons in the hierarchy header
    | 'hierarchy.footer'             // collapsible sections below entity tree
    | 'inspector.after-transform'    // below the XYZ transform fields
    | 'inspector.after-components'   // below the component list
    | 'bottom-tab';                  // new tab in the bottom panel (requires tabLabel)

// ─── Slot Fill ─────────────────────────────────────────────────────────────

export type EditorSlotFill = {
    slot: EditorSlotId;
    /** Required when slot === 'bottom-tab'. Shown as the clickable tab label. */
    tabLabel?: string;
    /** Lower numbers render first. Default: 0 */
    priority?: number;
    render: (ctx: EditorPluginContext) => React.ReactNode;
};

// ─── EditorPlugin (web-core) ───────────────────────────────────────────────
//
// Extends IEditorPlugin with React-specific slot fills.

export type EditorPlugin = IEditorPlugin & {
    slotFills?: ReadonlyArray<EditorSlotFill>;
};

// ─── EditorPluginRegistry (web-core) ──────────────────────────────────────

export type EditorPluginRegistry = IEditorPluginRegistry & {
    /**
     * Get all enabled fills for a given slot, sorted by priority.
     * Panels call this to inject plugin content into their render.
     */
    getSlotFills: (slot: EditorSlotId) => Array<EditorSlotFill & { pluginId: string }>;
};
