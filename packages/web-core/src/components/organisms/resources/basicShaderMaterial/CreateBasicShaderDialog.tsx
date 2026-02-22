'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';
import { createResourceWithZip } from '@/lib/api';

import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { ResourceKeyInput, ResourceDisplayNameInput } from '@/components/molecules/resource-ui/ResourceFormFields';
import { BasicShaderPreview } from '@/components/molecules/previews/BasicShaderPreview';
import { Select } from '@/components/atoms/Select';
import { Input } from '@/components/atoms/Input';
import { TrashIcon } from '@/components/icons';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { BasicShaderMaterialComponent } from '@duckengine/ecs';

export function CreateBasicShaderDialog() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);

    const [key, setKey] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');
    const [shaderFile, setShaderFile] = React.useState<File | null>(null);

    const [shaderSource, setShaderSource] = React.useState<string | undefined>();
    const [uniforms, setUniforms] = React.useState<Record<string, any>>({});
    const [componentData, setComponentData] = React.useState<Record<string, any>>({
        transparent: false,
        depthWrite: true,
        blending: 'normal'
    });

    const inspectorFields = React.useMemo(() => {
        const comp = new BasicShaderMaterialComponent({ shaderId: 'fake' });
        return comp.metadata.inspector?.fields.filter(f => f.key !== 'shaderId' && !f.key.startsWith('u_')) ?? [];
    }, []);

    const { submitting, setSubmitting, error, setError, reset } = useFormState();

    React.useEffect(() => {
        if (!shaderFile) {
            setShaderSource(undefined);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setShaderSource(e.target?.result as string);
        reader.readAsText(shaderFile);
    }, [shaderFile]);

    React.useEffect(() => {
        if (open) return;
        setKey('');
        setDisplayName('');
        setShaderFile(null);
        setShaderSource(undefined);
        setUniforms({});
        setComponentData({
            transparent: false,
            depthWrite: true,
            blending: 'normal'
        });
        reset();
    }, [open, reset]);

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
        if (!shaderSource) return;
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

    React.useEffect(() => {
        if (shaderSource && Object.keys(uniforms).length === 0) {
            detectUniformsFromSource();
        }
    }, [shaderSource]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!key.trim() || !displayName.trim()) {
            setError('Key and Display Name are required.');
            return;
        }
        if (!shaderFile) {
            setError('A .glsl, .wgsl, or .tsl file is required.');
            return;
        }

        setSubmitting(true);
        try {
            const extension = shaderFile.name.split('.').pop();
            const files = { [`shader.${extension}`]: shaderFile };

            const zipBlob = await createUploadZip({
                kind: 'basicShaderMaterial',
                key: key.trim(),
                displayName: displayName.trim(),
                componentData: {
                    ...componentData,
                    uniforms: getFinalUniforms(),
                },
            }, files);

            const zipFile = new File([zipBlob], `${key.trim()}.zip`, { type: 'application/zip' });

            await createResourceWithZip({
                kind: 'basicShaderMaterial',
                key: key.trim(),
                displayName: displayName.trim(),
                zip: zipFile,
            });

            setOpen(false);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setSubmitting(false);
        }
    };

    return (
        <>
            <Button type="button" onClick={() => setOpen(true)}>
                + Create basic shader
            </Button>

            <ResourceDialogLayout
                open={open}
                onOpenChange={setOpen}
                title="Create Basic Shader Material"
                onClose={() => setOpen(false)}
            >
                <ResourceDialogFormPanel onSubmit={onSubmit} error={error}>
                    <ResourceKeyInput value={key} onChange={setKey} placeholder="shaders/basic-sample" disabled={submitting} />
                    <ResourceDisplayNameInput value={displayName} onChange={setDisplayName} placeholder="My Basic Shader" disabled={submitting} />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>WebGPU Shader File (.glsl, .wgsl, .tsl)</Label>
                            <input type="file" accept=".glsl,.wgsl,.tsl" onChange={(e) => setShaderFile(e.target.files?.[0] ?? null)} disabled={submitting} className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                            <div className="text-xs text-neutral-600">{shaderFile ? `Selected: ${shaderFile.name}` : 'No file selected'}</div>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-neutral-800">
                            <Label className="text-xs uppercase tracking-wider text-neutral-500">Material Settings</Label>
                            <EcsInspectorFieldsForm
                                fields={inspectorFields}
                                value={componentData}
                                onChange={(val: any) => setComponentData(val)}
                                disabled={submitting}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <Label>Uniforms (Parameters)</Label>
                                <div className="flex gap-2">
                                    <Button type="button" variant="secondary" size="sm" onClick={detectUniformsFromSource} disabled={submitting || !shaderSource}>
                                        Auto-detect
                                    </Button>
                                    <Button type="button" variant="secondary" size="sm" onClick={addUniform} disabled={submitting}>
                                        + Add
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {Object.entries(uniforms).map(([id, u]) => (
                                    <div key={id} className="flex items-center gap-2 bg-neutral-900/50 p-2 rounded-md border border-neutral-800">
                                        <Input className="h-8 text-xs flex-1" placeholder="Name" value={u.key} onChange={(e) => updateUniform(id, 'key', e.target.value)} disabled={submitting} />
                                        <Select className="h-8 text-xs w-24" value={u.type} onChange={(e) => updateUniform(id, 'type', e.target.value)} disabled={submitting}>
                                            <option value="float">Float</option>
                                            <option value="color">Color</option>
                                            <option value="vec2">Vec2</option>
                                            <option value="vec3">Vec3</option>
                                        </Select>
                                        <Input className="h-8 text-xs w-20" type={u.type === 'float' ? 'number' : 'text'} step="0.01" value={u.type === 'color' && !u.value.toString().startsWith('#') ? '#ffffff' : u.value} onChange={(e) => updateUniform(id, 'value', u.type === 'float' ? parseFloat(e.target.value) : e.target.value)} disabled={submitting} />
                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-500 hover:text-red-500" onClick={() => removeUniform(id)} disabled={submitting}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4">
                        <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</Button>
                    </div>
                </ResourceDialogFormPanel>

                <ResourceDialogPreviewPanel className="flex-1 relative bg-black">
                    {shaderSource ? (
                        <BasicShaderPreview
                            resourceKey="preview-creation"
                            shaderSource={shaderSource}
                            uniforms={getFinalUniforms()}
                            componentData={componentData}
                            onError={(err) => setError(err ? err.message : null)}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-neutral-400 p-6">
                            <p className="text-sm">Upload shader source to preview.</p>
                        </div>
                    )}
                </ResourceDialogPreviewPanel>
            </ResourceDialogLayout>
        </>
    );
}
