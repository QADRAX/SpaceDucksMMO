import * as React from 'react';
import { EditorScripts } from '@duckengine/core';
import { EditorPluginSystem } from '../plugins/EditorPluginSystem';
import { usePluginSlotsRegistry } from '../plugins/usePluginSlots';
import type { EditorPluginContext } from '@duckengine/core';
import type { GameState } from '../types';

export function useEditorPlugins(args: {
    gameState: GameState;
    selectedId: string | null;
    actions: any;
    inputRef?: React.RefObject<any>;
}) {
    const registry = usePluginSlotsRegistry();
    const systemRef = React.useRef<EditorPluginSystem | null>(null);

    React.useEffect(() => {
        const sys = new EditorPluginSystem(registry);
        systemRef.current = sys;

        sys.initialize().then(() => {
            // Load and enable built-in plugins automatically
            for (const [key, source] of Object.entries(EditorScripts)) {
                if (key.startsWith('editor://builtin_')) {
                    try {
                        const plugin = sys.loadPluginFromSource(source as string);
                        registry.setEnabled(plugin.meta.id, true);
                        if (plugin.onEnable) {
                            const cleanup = plugin.onEnable(getContext());
                            // TODO: store cleanup
                        }
                    } catch (e) {
                        console.error(`Failed to load built-in plugin ${key}`, e);
                    }
                }
            }
        });

        return () => {
            sys.dispose();
            systemRef.current = null;
        };
    }, [registry]);

    // Build context lazily to avoid triggering effect cycles, yet always
    // having fresh references to state.
    const getContext = (): EditorPluginContext => {
        return {
            selectedEntityId: args.selectedId,
            gameState: args.gameState,
            createEntity: (parentId) => args.actions.onCreateEmpty(parentId),
            deleteSelectedEntity: () => args.actions.onDeleteSelected(),
            duplicateSelectedEntity: () => args.actions.onDuplicateSelected(),
            setSelectedEntity: (id) => args.actions.setSelectedId(id),
            reparentEntity: (child, parent) => args.actions.onReparentEntity(child, parent),
            setError: (msg) => console.error(msg),
            onKeyDown: (shortcut, handler) => {
                const keyboard = args.inputRef?.current?.keyboard;
                if (!keyboard) return () => { };
                // Ideally this interacts with a specialized shortcut manager,
                // but for now we'll wire it directly if supported
                if (keyboard.onKeyDown) {
                    keyboard.onKeyDown(shortcut, handler);
                    // To do cleanup, we'd need keyboard.offKeyDown.
                    // Returning a dummy for now.
                    return () => { };
                }
                return () => { };
            }
        };
    };

    const tick = React.useCallback((dt: number): void => {
        if (systemRef.current) {
            systemRef.current.tick(dt, getContext());
        }
    }, [args.selectedId, args.gameState, args.actions, args.inputRef]);

    const notifySelectionChanged = React.useCallback((ids: string[]) => {
        if (systemRef.current) {
            systemRef.current.notifySelectionChanged(ids, getContext());
        }
    }, [args.selectedId, args.gameState, args.actions, args.inputRef]);

    const notifyGameStateChanged = React.useCallback((state: 'stopped' | 'playing' | 'paused') => {
        if (systemRef.current) {
            systemRef.current.notifyGameStateChanged(state, getContext());
        }
    }, [args.selectedId, args.gameState, args.actions, args.inputRef]);

    return { tick, notifySelectionChanged, notifyGameStateChanged };
}
