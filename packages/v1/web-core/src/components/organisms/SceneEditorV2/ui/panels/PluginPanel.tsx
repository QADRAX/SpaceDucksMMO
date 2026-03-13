'use client';

import * as React from 'react';
import { usePluginSlotsRegistry } from '../../plugins/usePluginSlots';
import { Label } from '@/components/atoms/Label';
import type { EditorPlugin, EditorPluginConfigField } from '../../plugins/pluginTypes';

/**
 * PluginPanel — The UI for managing editor plugins.
 * Lists all registered plugins, allows enabling/disabling, and exposes config fields.
 */
export function PluginPanel() {
    const registry = usePluginSlotsRegistry();
    const plugins = registry.plugins;

    // Group by category
    const categories = ['visualization', 'actions', 'panels', 'scripting'] as const;

    return (
        <div className="flex h-full flex-col overflow-auto bg-white text-sm text-black">
            <div className="p-4 space-y-6">
                {categories.map((category) => {
                    const categoryPlugins = plugins.filter((p: EditorPlugin) => p.meta.category === category);
                    if (categoryPlugins.length === 0) return null;

                    return (
                        <div key={category} className="space-y-3">
                            <h3 className="font-black uppercase tracking-widest text-[10px] text-black/50 border-b-2 border-black/10 pb-1">
                                {category}
                            </h3>
                            <div className="grid gap-3">
                                {categoryPlugins.map((plugin: EditorPlugin) => (
                                    <div
                                        key={plugin.meta.id}
                                        className={`border-2 border-black p-3 transition-colors ${plugin.enabled ? 'bg-black/5' : 'opacity-70'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`plugin-${plugin.meta.id}`}
                                                    checked={plugin.enabled}
                                                    onChange={(e) =>
                                                        registry.setEnabled(plugin.meta.id, e.target.checked)
                                                    }
                                                    className="w-4 h-4 rounded-none border-2 border-black accent-main"
                                                />
                                                <Label
                                                    htmlFor={`plugin-${plugin.meta.id}`}
                                                    className="font-bold cursor-pointer"
                                                >
                                                    {plugin.meta.icon ? <span className="mr-2">{plugin.meta.icon}</span> : null}
                                                    {plugin.meta.displayName}
                                                </Label>
                                            </div>
                                            {plugin.meta.source.kind !== 'builtin' && (
                                                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-black text-white">
                                                    {plugin.meta.source.kind}
                                                </span>
                                            )}
                                        </div>

                                        {plugin.meta.description && (
                                            <p className="mt-1 ml-6 text-xs text-black/60">
                                                {plugin.meta.description}
                                            </p>
                                        )}

                                        {/* Render config fields if enabled and present */}
                                        {plugin.enabled && plugin.meta.configFields && plugin.meta.configFields.length > 0 && (
                                            <div className="mt-3 ml-6 space-y-2 border-t border-black/10 pt-2">
                                                {plugin.meta.configFields.map((field: EditorPluginConfigField) => {
                                                    const val = plugin.config[field.key] ?? field.defaultValue;

                                                    // A very basic renderer for now. We can expand this.
                                                    if (field.type === 'boolean') {
                                                        return (
                                                            <div key={field.key} className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`cfg-${plugin.meta.id}-${field.key}`}
                                                                    checked={val as boolean}
                                                                    onChange={(e) => registry.setConfig(plugin.meta.id, field.key, e.target.checked)}
                                                                    className="w-4 h-4 rounded-none border-2 border-black accent-main"
                                                                />
                                                                <Label htmlFor={`cfg-${plugin.meta.id}-${field.key}`} className="text-xs">{field.label}</Label>
                                                            </div>
                                                        );
                                                    }

                                                    if (field.type === 'number') {
                                                        return (
                                                            <div key={field.key} className="flex flex-col gap-1">
                                                                <Label className="text-xs">{field.label}</Label>
                                                                <input
                                                                    type="number"
                                                                    className="border-2 border-black w-32 px-1 text-sm bg-white"
                                                                    value={val as number}
                                                                    min={field.min} max={field.max} step={field.step}
                                                                    onChange={(e) => registry.setConfig(plugin.meta.id, field.key, parseFloat(e.target.value))}
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    // Fallback string/color input
                                                    return (
                                                        <div key={field.key} className="flex flex-col gap-1">
                                                            <Label className="text-xs">{field.label}</Label>
                                                            <input
                                                                type={field.type === 'color' ? 'color' : 'text'}
                                                                className="border-2 border-black w-full px-1 text-sm bg-white"
                                                                value={val as string}
                                                                onChange={(e) => registry.setConfig(plugin.meta.id, field.key, e.target.value)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {plugins.length === 0 && (
                    <div className="text-center text-black/40 italic py-10">
                        No plugins registered.
                    </div>
                )}
            </div>
        </div>
    );
}
