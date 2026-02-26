'use client';

import * as React from 'react';

type LogEntry = {
    id: number;
    level: 'log' | 'warn' | 'error';
    message: string;
    time: string;
};

/** ConsolePanel — Lua script logs and engine warnings. Wire-up in Phase 4. */
export function ConsolePanel() {
    const [entries, setEntries] = React.useState<LogEntry[]>([]);

    const levelColor = (l: LogEntry['level']) =>
        l === 'error' ? 'text-red-600 font-bold'
            : l === 'warn' ? 'text-amber-600 font-bold'
                : 'text-black';

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b-2 border-black bg-black px-3 py-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-white">Console</span>
                <button
                    className="text-xs font-bold text-white/60 hover:text-white transition-colors"
                    onClick={() => setEntries([])}
                >
                    Clear
                </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs">
                {entries.length === 0 ? (
                    <p className="px-3 py-4 text-center text-black/30 uppercase tracking-widest font-bold text-xs">
                        No output
                    </p>
                ) : (
                    entries.map((e) => (
                        <div
                            key={e.id}
                            className={`flex gap-3 border-b border-black/10 px-3 py-0.5 ${levelColor(e.level)}`}
                        >
                            <span className="shrink-0 text-black/30">{e.time}</span>
                            <span className="break-all">{e.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
