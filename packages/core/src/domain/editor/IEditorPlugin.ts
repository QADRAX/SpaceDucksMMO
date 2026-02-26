/**
 * IEditorPlugin.ts — Platform-agnostic editor plugin contracts.
 *
 * These types live in @duckengine/core because:
 *  - They have no React/DOM dependency
 *  - The scripting system (Lua bridge) will need them
 *  - Future headless/test renderers must be able to implement them
 *
 * The web-core layer adds React-specific extensions (slot fills, JSX renders).
 */

// ─── Config Field Schema ────────────────────────────────────────────────────
//
// Discriminated union — each field type maps to a specific input widget
// in the plugin manager UI without requiring any per-plugin UI code.

export type EditorPluginConfigValue = boolean | number | string;

export type EditorPluginConfigField =
    | {
        key: string;
        label: string;
        description?: string;
        type: 'boolean';
        defaultValue: boolean;
    }
    | {
        key: string;
        label: string;
        description?: string;
        type: 'number';
        defaultValue: number;
        min?: number;
        max?: number;
        step?: number;
        /** Display unit suffix, e.g. 'px', 'ms', '%', 'u' */
        unit?: string;
    }
    | {
        key: string;
        label: string;
        description?: string;
        type: 'string';
        defaultValue: string;
        placeholder?: string;
    }
    | {
        key: string;
        label: string;
        description?: string;
        type: 'color';
        /** CSS color string, e.g. '#ff0000' or 'rgba(255,0,0,0.5)' */
        defaultValue: string;
    }
    | {
        key: string;
        label: string;
        description?: string;
        type: 'select';
        defaultValue: string;
        options: ReadonlyArray<{ value: string; label: string }>;
    }
    | {
        key: string;
        label: string;
        description?: string;
        /**
         * Keyboard shortcut field — the UI renders a shortcut recorder input.
         * Value format: modifier(s) joined with '+', e.g. 'ctrl+d', 'shift+f', 'delete'
         */
        type: 'shortcut';
        defaultValue: string;
    };

// ─── Plugin Metadata ────────────────────────────────────────────────────────

export type EditorPluginCategory =
    | 'visualization'  // gizmos, wireframes, overlays
    | 'actions'        // keyboard shortcuts, entity operations
    | 'panels'         // adds UI tabs or sections
    | 'scripting';     // Lua-backed editor scripts

export type EditorPluginSource =
    | { kind: 'builtin' }
    | {
        kind: 'editorScript';
        resourceKey: string;
        resourceDisplayName: string;
    };

export type EditorPluginMeta = {
    /**
     * Globally unique ID.
     * Built-ins use the 'builtin:' prefix, e.g. 'builtin:entity-actions'.
     * EditorScript plugins use 'script:<resourceKey>'.
     */
    id: string;
    displayName: string;
    description?: string;
    /** Emoji or icon identifier rendered in the plugin manager. */
    icon?: string;
    category: EditorPluginCategory;
    source: EditorPluginSource;
    /**
     * Configurable fields. The plugin manager generates one input per field.
     * Defaults are automatically seeded from `defaultValue` on registration.
     */
    configFields?: ReadonlyArray<EditorPluginConfigField>;
};

// ─── Plugin Context ─────────────────────────────────────────────────────────
//
// Passed to every lifecycle callback. Platform-agnostic: no React here.
// The web-core layer provides a React-backed implementation of this interface.

export type EditorPluginContext = {
    // ── Read-only state ─────────────────────────────────────────────────────
    readonly selectedEntityId: string | null;
    readonly gameState: 'stopped' | 'playing' | 'paused';

    // ── Entity actions ───────────────────────────────────────────────────────
    createEntity: (parentId?: string | null) => void;
    deleteSelectedEntity: () => void;
    duplicateSelectedEntity: () => void;
    setSelectedEntity: (id: string | null) => void;
    reparentEntity: (childId: string, newParentId: string | null) => void;
    setError: (msg: string | null) => void;

    // ── Keyboard shortcut registration ───────────────────────────────────────
    /**
     * Register a keyboard shortcut. Active only when the editor viewport is focused.
     * @returns A disposal function — call in the cleanup returned by onEnable.
     */
    onKeyDown: (shortcut: string, handler: () => void) => (() => void);
};

// ─── Plugin Declaration ─────────────────────────────────────────────────────
//
// Platform-agnostic base. The web-core layer extends this with
// React-specific slot fills (EditorPlugin in pluginTypes.ts).

export type IEditorPlugin = {
    meta: EditorPluginMeta;
    enabled: boolean;
    /**
     * Current config. Keys match meta.configFields[n].key.
     * Populated from defaultValue on registration; persisted in scene snapshot.
     */
    config: Readonly<Record<string, EditorPluginConfigValue>>;

    /**
     * Called when the plugin is enabled.
     * Register shortcuts here via ctx.onKeyDown.
     * The return value (if any) must be a cleanup function — called on disable.
     */
    onEnable?: (ctx: EditorPluginContext) => (() => void) | void;

    /** Called every animation frame regardless of game state. */
    onTick?: (dt: number, ctx: EditorPluginContext) => void;

    onSelectionChanged?: (ids: string[], ctx: EditorPluginContext) => void;
    onGameStateChanged?: (
        state: 'stopped' | 'playing' | 'paused',
        ctx: EditorPluginContext
    ) => void;

    /**
     * Called when the user changes a config value in the plugin manager.
     * Use this to react to config changes at runtime without a full disable/enable cycle.
     */
    onConfigChanged?: (
        key: string,
        value: EditorPluginConfigValue,
        ctx: EditorPluginContext
    ) => void;
};

// ─── Plugin Registry (platform-agnostic interface) ──────────────────────────

export type IEditorPluginRegistry = {
    readonly plugins: ReadonlyArray<IEditorPlugin>;
    register: (plugin: Omit<IEditorPlugin, 'config'>) => void;
    unregister: (pluginId: string) => void;
    setEnabled: (pluginId: string, enabled: boolean) => void;
    setConfig: (pluginId: string, key: string, value: EditorPluginConfigValue) => void;
};

// ─── Plugin Loader (external / editorScript resources) ──────────────────────
//
// Declared now, implemented in Phase 6 (EditorScript resource loading).
// Decoupled from the registry so built-ins work independently of Lua loading.

export type IEditorPluginLoader = {
    /**
     * Fetch and register an editorScript resource as a plugin.
     * @returns The plugin ID on success, null on failure.
     */
    loadFromResource: (resourceKey: string) => Promise<string | null>;
    /** Unload and unregister a previously loaded external plugin. */
    unload: (pluginId: string) => Promise<void>;
};
