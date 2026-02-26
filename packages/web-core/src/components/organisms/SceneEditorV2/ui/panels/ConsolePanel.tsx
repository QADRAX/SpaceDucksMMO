'use client';

import * as React from 'react';
import { useEditorStore } from '../../store';

/** ConsolePanel — Displays engine, Lua, and editor logs from the centralized store. */
export function ConsolePanel() {
    const logs = useEditorStore((s) => s.logs);
    const clearLogs = useEditorStore((s) => s.clearLogs);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs.length]);

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'error': return 'text-red-500 font-bold bg-red-500/5';
            case 'warn': return 'text-amber-500 font-bold bg-amber-500/5';
            default: return 'text-white/80';
        }
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#0A0A0A]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black px-3 py-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Output</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/60">
                        {logs.length}
                    </span>
                </div>
                <button
                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                    onClick={clearLogs}
                >
                    Clear
                </button>
            </div>

            {/* Log List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
                {logs.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center opacity-20">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Logs</span>
                    </div>
                ) : (
                    logs.map((e: any) => (
                        <div
                            key={e.id}
                            className={`group flex items-start gap-3 border-b border-white/5 px-3 py-1.5 hover:bg-white/5 ${getSeverityStyles(e.severity)}`}
                        >
                            <span className="shrink-0 opacity-30 select-none">{formatTime(e.timestamp)}</span>
                            <span className="shrink-0 rounded bg-white/10 px-1 py-0 text-[10px] font-bold uppercase tracking-tight text-white/40 group-hover:text-white/60 transition-colors">
                                {e.system}
                            </span>
                            <span className="break-all whitespace-pre-wrap">{e.message}</span>
                            {e.data && (
                                <span className="opacity-40 italic ml-1 text-[10px]">
                                    {typeof e.data === 'object' ? JSON.stringify(e.data) : String(e.data)}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

