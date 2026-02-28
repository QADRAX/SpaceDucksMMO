/**
 * Platform-agnostic editor extension contracts.
 * Extensions are global additions to the editor (panels, tools, actions).
 */

export type EditorExtensionConfigValue = boolean | number | string;

/**
 * Metadata for a configurable field in an extension.
 */
export type EditorExtensionConfigField =
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
        type: 'shortcut';
        defaultValue: string;
    };

/**
 * A generic UI element descriptor for slot-based rendering.
 */
export type UIElementDescriptor = {
    type: 'button' | 'toggle' | 'label' | 'row' | 'column';
    props?: Record<string, any>;
    children?: UIElementDescriptor[];
};

export type EditorExtensionCategory =
    | 'visualization'
    | 'actions'
    | 'panels'
    | 'scripting';

export type EditorExtensionSource =
    | { kind: 'builtin' }
    | {
        kind: 'editorScript';
        resourceKey: string;
        resourceDisplayName: string;
    };

/**
 * Metadata defining an editor extension.
 */
export type EditorExtensionMeta = {
    readonly id: string;
    displayName: string;
    description?: string;
    icon?: string;
    category: EditorExtensionCategory;
    source: EditorExtensionSource;
    configFields?: ReadonlyArray<EditorExtensionConfigField>;
};

/**
 * Context passed to editor-wide extensions.
 */
export type EditorExtensionContext = {
    readonly selectedEntityId: string | null;
    readonly gameState: 'stopped' | 'playing' | 'paused';

    createEntity: (parentId?: string | null) => void;
    deleteSelectedEntity: () => void;
    setSelectedEntity: (id: string | null) => void;
    reparentEntity: (childId: string, newParentId: string | null) => void;
    setError: (msg: string | null) => void;

    /** Registers a global keyboard shortcut. */
    onKeyDown: (shortcut: string, handler: () => void) => (() => void);
};

/**
 * An Editor Extension adds global functionality to the workbench.
 */
export interface IEditorExtension {
    meta: EditorExtensionMeta;
    enabled: boolean;
    config: Readonly<Record<string, EditorExtensionConfigValue>>;

    /** Called when the extension is enabled. */
    onEnable?: (ctx: EditorExtensionContext) => (() => void) | void;
    /** Called every frame. */
    onTick?: (dt: number, ctx: EditorExtensionContext) => void;
    onSelectionChanged?: (ids: string[], ctx: EditorExtensionContext) => void;
    onGameStateChanged?: (state: 'stopped' | 'playing' | 'paused', ctx: EditorExtensionContext) => void;
    onConfigChanged?: (key: string, value: EditorExtensionConfigValue, ctx: EditorExtensionContext) => void;
}

/**
 * Registry managing the lifecycle of all editor extensions.
 */
export interface IEditorExtensionRegistry {
    readonly extensions: ReadonlyArray<IEditorExtension>;
    register: (extension: Omit<IEditorExtension, 'config'>) => void;
    unregister: (id: string) => void;
    setEnabled: (id: string, enabled: boolean) => void;
    setConfig: (id: string, key: string, value: EditorExtensionConfigValue) => void;
}
