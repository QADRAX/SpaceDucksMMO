'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';
import { AdminService } from '@/lib/api';

import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import { ResourceVersionsTable } from '@/components/organisms/ResourceVersionsTable';
import { ResourceDetailHeader } from '@/components/molecules/resource-ui/ResourceDetailHeader';
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { useResourceMutations } from '@/hooks/useResourceMutations';
import { CustomShaderPreview } from '@/components/molecules/previews/CustomShaderPreview';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { TrashIcon } from '@/components/icons';

import { VersionSummary } from '../types';

type ResourceSummary = { id: string; kind: 'customShader'; activeVersion: number };

const DEFAULT_SHADER_CODE = `vec4 fragmentMain(vec2 uv, float time) {
  // Center UVs and add rotation over time
  vec2 p = uv * 2.0 - 1.0;
  float t = time * 0.5;
  
  float r = sin(p.x * 10.0 + t) * 0.5 + 0.5;
  float g = cos(p.y * 10.0 - t) * 0.5 + 0.5;
  float b = sin((p.x + p.y) * 5.0 + t) * 0.5 + 0.5;
  
  return vec4(r, g, b, 1.0);
}`;

export function CustomShaderDetailPanel({ resource, versions }: { resource: ResourceSummary; versions: VersionSummary[] }) {
    const { setActiveVersion, deleteVersion, isBusy } = useResourceMutations(resource.id);

    const [creatingOpen, setCreatingOpen] = React.useState(false);
    const [shaderFile, setShaderFile] = React.useState<File | null>(null);

    const [shaderSource, setShaderSource] = React.useState<string>(DEFAULT_SHADER_CODE);
    const [uniforms, setUniforms] = React.useState<Record<string, any>>({});

    const activeVersion = React.useMemo(() => versions.find((v) => v.version === resource.activeVersion) ?? versions[0] ?? null, [versions, resource.activeVersion]);

    // Update sources when files are selected
    React.useEffect(() => {
        if (shaderFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (typeof e.target?.result === 'string') {
                    setShaderSource(e.target.result);
                }
            };
            reader.readAsText(shaderFile);
        }
    }, [shaderFile]);

    // Load initial data from active version
    React.useEffect(() => {
        if (!activeVersion) return;

        // Load uniforms
        if (activeVersion.componentData) {
            try {
                const data = JSON.parse(activeVersion.componentData);
                if (data.uniforms) {
                    const mapped: Record<string, any> = {};
                    Object.entries(data.uniforms).forEach(([k, u]: [string, any]) => {
                        const id = `u_init_${k}`;
                        mapped[id] = { key: k, value: u.value, type: u.type };
                    });
                    setUniforms(mapped);
                } else {
                    setUniforms({});
                }
            } catch (e) {
                console.error('Failed to parse componentData', e);
            }
        }

        // Load source from binding
        const binding = activeVersion.bindings.find(b => b.slot === 'shader' || b.fileName.match(/\.(glsl|wgsl|tsl)$/i));
        if (binding) {
            fetch(`/api/admin/assets/content/${binding.fileAssetId}`)
                .then(res => res.text())
                .then(setShaderSource)
                .catch(console.error);
        }
    }, [activeVersion]);

    const isWgsl = React.useMemo(() => {
        return /\bfn\s+\w+\s*\(/.test(shaderSource) || shaderSource.includes('->');
    }, [shaderSource]);

    const addUniform = () => {
        const id = `u_${Date.now()}`;
        setUniforms(prev => ({
            ...prev,
            [id]: { key: '', value: 0.5, type: 'float' }
        }));
    };

    const removeUniform = (id: string) => {
        setUniforms(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const updateUniform = (id: string, field: string, val: any) => {
        setUniforms(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: val }
        }));
    };

    const getFinalUniforms = () => {
        const result: Record<string, any> = {};
        Object.values(uniforms).forEach(u => {
            if (u.key.trim()) {
                result[u.key.trim()] = { value: u.value, type: u.type };
            }
        });
        return result;
    };

    const detectUniformsFromSource = () => {
        // Simple regex to find the first function signature
        const clean = shaderSource
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .trim();

        const wgslMatch = clean.match(/fn\s+\w+\s*\(([^)]*)\)/);
        const glslMatch = !wgslMatch ? clean.match(/(?:vec[234]|float)\s+\w+\s*\(([^)]*)\)/) : null;

        const argString = wgslMatch?.[1] || glslMatch?.[1] || '';
        if (!argString) return;

        const args = argString.split(',').map(a => a.trim());
        const nextUniforms = { ...uniforms };
        let added = false;

        args.forEach(arg => {
            let key = '';
            let typeStr = '';

            if (arg.includes(':')) {
                const parts = arg.split(':').map(p => p.trim());
                key = parts[0];
                typeStr = parts[1];
            } else {
                const parts = arg.split(/\s+/).map(p => p.trim());
                if (parts.length >= 2) {
                    typeStr = parts[0];
                    key = parts[1];
                }
            }

            const standardKeys = ['uv', 'time', 'normalLocal', 'normalView', 'positionLocal', 'positionView'];
            if (key && !standardKeys.includes(key)) {
                let type: any = 'float';
                if (typeStr.includes('vec2')) type = 'vec2';
                else if (typeStr.includes('vec3')) type = 'vec3';
                else if (typeStr.includes('vec4')) type = 'vec4';
                else if (typeStr.includes('color')) type = 'color';

                const exists = Object.values(nextUniforms).some((u: any) => u.key === key);
                if (!exists) {
                    const id = `u_auto_${key}`;
                    nextUniforms[id] = {
                        key,
                        type,
                        value: type === 'color' ? '#ffffff' : (type === 'float' ? 1.0 : [0, 0, 0])
                    };
                    added = true;
                }
            }
        });

        if (added) setUniforms(nextUniforms);
    };

    // activeVersion is already defined at the top

    const { submitting, setSubmitting, error, setError, reset } = useFormState();
    const router = useRouter();

    React.useEffect(() => {
        if (creatingOpen) return;
        setShaderFile(null);
        setUniforms({});
        reset();
    }, [creatingOpen, reset]);

    const submitNewVersion = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const ext = isWgsl ? 'wgsl' : 'glsl';
        // If they typed in the editor but didn't select a file, create blob from the text
        const finalShaderFile = shaderFile || new File([new Blob([shaderSource], { type: 'text/plain' })], `shader.${ext}`);

        setSubmitting(true);
        try {
            const files = {
                [`shader.${ext}`]: finalShaderFile,
            };

            const zipBlob = await createUploadZip({
                kind: 'customShader',
                componentData: {
                    uniforms: getFinalUniforms()
                },
            }, files);

            const zipFile = new File([zipBlob], `customShader-${resource.id}.zip`, { type: 'application/zip' });

            await AdminService.postApiAdminResourcesVersions(resource.id, {
                zip: zipFile,
            });

            setCreatingOpen(false);
            router.refresh();
        } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); setSubmitting(false); }
    };

    return (
        <div className="h-full min-h-0 flex flex-col">
            <ResourceDetailHeader
                title="Versions"
                activeVersion={resource.activeVersion}
                totalVersions={versions.length}
                onAction={() => setCreatingOpen(true)}
            />

            <section className="flex-1 min-h-0">
                <ResourceVersionsTable
                    versions={versions}
                    activeVersion={resource.activeVersion}
                    onSetActive={setActiveVersion}
                    onDelete={deleteVersion}
                    deleteDisabled={(v) => versions.length <= 1 || resource.activeVersion === v.version || isBusy}
                    deleteTitle={(v) => versions.length <= 1 ? 'Cannot delete the only version' : resource.activeVersion === v.version ? 'Cannot delete the active version' : 'Delete'}
                    containerClassName="h-full"
                />
            </section>

            <ResourceDialogLayout
                open={creatingOpen}
                onOpenChange={setCreatingOpen}
                title="New Custom Shader Version"
                subtitle="Create"
                onClose={() => setCreatingOpen(false)}
                fullscreen={true}
                className="max-w-7xl"
            >
                <div className="flex h-full w-full bg-neutral-900 overflow-hidden">
                    <ResourceDialogFormPanel onSubmit={submitNewVersion} error={error} className="w-[450px] shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col overflow-y-auto">
                        <div className="p-4 space-y-4 flex flex-col h-full">
                            <div className="space-y-2">
                                <Label>WebGPU Shader File (.glsl, .tsl)</Label>
                                <input type="file" accept=".glsl,.tsl,.wgsl" onChange={(e) => setShaderFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                                <div className="text-xs text-neutral-600">{shaderFile ? `Selected: ${shaderFile.name}` : 'Or edit code below'}</div>
                            </div>

                            <div className="flex-1 flex flex-col space-y-2 pb-4">
                                <Label className="flex justify-between items-center">
                                    Shader Source
                                    <span className="text-[10px] text-neutral-500 font-normal">TSL-compatible function</span>
                                </Label>
                                <textarea
                                    className="w-full flex-1 min-h-[300px] p-3 font-mono text-xs bg-[#1e1e1e] text-[#d4d4d4] border border-neutral-800 rounded resize-none focus:outline-none focus:border-primary/50"
                                    value={shaderSource}
                                    onChange={(e) => setShaderSource(e.target.value)}
                                    spellCheck={false}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label>Uniforms (Parameters)</Label>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="secondary" size="sm" onClick={detectUniformsFromSource} disabled={submitting} title="Detect parameters from code">
                                            Auto-detect
                                        </Button>
                                        <Button type="button" variant="secondary" size="sm" onClick={addUniform} disabled={submitting}>
                                            + Add
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                    {Object.entries(uniforms).map(([id, u]) => (
                                        <div key={id} className="flex items-center gap-2 bg-neutral-900 p-2 rounded-md border border-neutral-800">
                                            <Input
                                                className="h-8 text-xs flex-1"
                                                placeholder="Name"
                                                value={u.key}
                                                onChange={(e) => updateUniform(id, 'key', e.target.value)}
                                                disabled={submitting}
                                            />
                                            <Select
                                                className="h-8 text-xs w-24"
                                                value={u.type}
                                                onChange={(e) => updateUniform(id, 'type', e.target.value)}
                                                disabled={submitting}
                                            >
                                                <option value="float">Float</option>
                                                <option value="color">Color</option>
                                                <option value="vec2">Vec2</option>
                                                <option value="vec3">Vec3</option>
                                            </Select>
                                            <Input
                                                className="h-8 text-xs w-20"
                                                type={u.type === 'float' ? 'number' : 'text'}
                                                step="0.01"
                                                value={u.type === 'color' && !u.value.toString().startsWith('#') ? '#ffffff' : u.value}
                                                onChange={(e) => updateUniform(id, 'value', u.type === 'float' ? parseFloat(e.target.value) : e.target.value)}
                                                disabled={submitting}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-neutral-500 hover:text-red-500"
                                                onClick={() => removeUniform(id)}
                                                disabled={submitting}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {Object.keys(uniforms).length === 0 && (
                                        <div className="text-[10px] text-neutral-500 italic text-center py-2 opacity-50">
                                            No custom parameters defined.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-neutral-800 flex justify-end">
                            <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create version'}</Button>
                        </div>
                    </ResourceDialogFormPanel>

                    <ResourceDialogPreviewPanel className="flex-1 relative">
                        <CustomShaderPreview
                            resourceKey={`customShader-${resource.id}`}
                            shaderSource={shaderSource}
                            uniforms={getFinalUniforms()}
                            onError={(err) => setError(err ? err.message : null)}
                        />
                    </ResourceDialogPreviewPanel>
                </div>
            </ResourceDialogLayout>
        </div>
    );
}

export default CustomShaderDetailPanel;
