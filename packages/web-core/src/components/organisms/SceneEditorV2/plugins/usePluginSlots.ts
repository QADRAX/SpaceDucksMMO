import * as React from 'react';
import { PluginSlotsContext } from './PluginSlotsContext';
import type { EditorSlotId, EditorSlotFill } from './pluginTypes';

export function usePluginSlotsRegistry() {
    const registry = React.useContext(PluginSlotsContext);
    if (!registry) {
        throw new Error('usePluginSlotsRegistry must be used within a PluginSlotsProvider');
    }
    return registry;
}

/**
 * Returns the currently active fills for a specific slot, sorted by priority.
 */
export function usePluginSlot(slot: EditorSlotId): Array<EditorSlotFill & { pluginId: string }> {
    const registry = usePluginSlotsRegistry();
    return registry.getSlotFills(slot);
}
