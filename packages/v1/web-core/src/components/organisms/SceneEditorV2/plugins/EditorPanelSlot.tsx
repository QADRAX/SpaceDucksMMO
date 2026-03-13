import * as React from 'react';
import { usePluginSlot } from './usePluginSlots';
import type { EditorSlotId } from './pluginTypes';

interface EditorPanelSlotProps {
    slotId: EditorSlotId;
    className?: string;
}

export function EditorPanelSlot({ slotId, className }: EditorPanelSlotProps) {
    const fills = usePluginSlot(slotId);

    if (fills.length === 0) {
        return null;
    }

    // TODO: A real plugin system context would pass EditorPluginContext
    // For now, since plugins are React nodes, we just call render(null as any)
    // We will fix the context passing in Phase 6.
    return (
        <div className={className}>
            {fills.map((fill) => (
                <React.Fragment key={fill.pluginId}>
                    {fill.render(null as any)}
                </React.Fragment>
            ))}
        </div>
    );
}
