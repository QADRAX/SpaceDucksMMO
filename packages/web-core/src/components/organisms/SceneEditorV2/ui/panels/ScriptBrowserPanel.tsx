'use client';

import * as React from 'react';

/** ScriptBrowserPanel — scripts and prefabs content browser. API integration in Phase 3. */
export function ScriptBrowserPanel() {
    const [search, setSearch] = React.useState('');

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Search bar */}
            <div className="border-b-2 border-black/10 p-2">
                <input
                    className="w-full border-2 border-black bg-white px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-main"
                    placeholder="Search scripts & prefabs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2">
                <p className="border-2 border-dashed border-black/20 p-4 text-center text-xs font-bold uppercase tracking-widest text-black/30">
                    Script & prefab resources appear here.
                    <br />
                    Add scripts via Resources → New Script.
                </p>
            </div>
        </div>
    );
}
