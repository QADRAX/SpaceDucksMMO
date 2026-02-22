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
import { StandardShaderPreview } from '@/components/molecules/previews/StandardShaderPreview';
import { Select } from '@/components/atoms/Select';
import { Input } from '@/components/atoms/Input';
import { TrashIcon } from '@/components/icons';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { StandardShaderMaterialComponent } from '@duckengine/ecs';

export function CreateStandardShaderDialog() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);

    const [key, setKey] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');
    const [shaderFile, setShaderFile] = React.useState<File | null>(null);

    const [shaderSource, setShaderSource] = React.useState<string | undefined>();
    const [uniforms, setUniforms] = React.useState<Record<string, any>>({});
    const [componentData, setComponentData] = React.useState<Record<string, any>>({
        roughness: 0.5,
        metalness: 0.0,
        transparent: false,
        depthWrite: true,
        blending: 'normal'
    });

    const inspectorFields = React.useMemo(() => {
        const comp = new StandardShaderMaterialComponent({ shaderId: 'fake' });
        // Filter out fields that are handled manually (shaderId and uniforms which start with u_)
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
        setComponentData({ roughness: 0.5, metalness: 0.0, transparent: false, depthWrite: true, blending: 'normal' });
        reset();
    }, [open, reset]);

    const addUniform = () => {
        setUniforms(prev => ({ ...prev, [`u_${Date.now()}`]: { key: '', value: 0.5, type: 'float' } }));
    };

    const removeUniform = (id: string) => {
        setUniforms(prev => { const next = { ...prev }; delete next[id]; return next; });
    };

    const updateUniform = (id: string, field: string, val: any) => {
        setUniforms(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
    };

    const getFinalUniforms = () => {
        const result: Record<string, any> = {};
        Object.values(uniforms).forEach(u => { if (u.key.trim()) result[u.key.trim()] = { value: u.value, type: u.type }; });
        return result;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!key.trim() || !displayName.trim()) { setError('Key and Display Name are required.'); return; }
        if (!shaderFile) { setError('A shader file is required.'); return; }

        setSubmitting(true);
        try {
            const extension = shaderFile.name.split('.').pop();
            const zipBlob = await createUploadZip({
                kind: 'standardShaderMaterial',
                key: key.trim(),
                displayName: displayName.trim(),
                componentData: {
                    ...componentData,
                    uniforms: getFinalUniforms(),
                },
            }, { [`shader.${extension}`]: shaderFile });

            const zipFile = new File([zipBlob], `${key.trim()}.zip`, { type: 'application/zip' });
            await createResourceWithZip({
                kind: 'standardShaderMaterial',
                key: key.trim(),
                displayName: displayName.trim(),
                zip: zipFile,
            });

            setOpen(false);
            router.refresh();
        } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); setSubmitting(false); }
    };

    return (
        <>
            <Button type="button" onClick={() => setOpen(true)}>+ Create standard shader</Button>
            <ResourceDialogLayout open={open} onOpenChange={setOpen} title="Create Standard Shader Material" onClose={() => setOpen(false)}>
                <ResourceDialogFormPanel onSubmit={onSubmit} error={error}>
                    <ResourceKeyInput value={key} onChange={setKey} placeholder="shaders/std-sample" disabled={submitting} />
                    <ResourceDisplayNameInput value={displayName} onChange={setDisplayName} placeholder="My Standard Shader" disabled={submitting} />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Shader File</Label>
                            <input type="file" accept=".glsl,.wgsl,.tsl" onChange={(e) => setShaderFile(e.target.files?.[0] ?? null)} disabled={submitting} className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground" />
                        </div>

                        <div className="space-y-4 pt-2 border-t border-neutral-800">
                            <Label>Material Properties</Label>
                            <EcsInspectorFieldsForm fields={inspectorFields} value={componentData} onChange={setComponentData} disabled={submitting} />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-neutral-800">
                            <div className="flex items-center justify-between">
                                <Label>Uniforms</Label>
                                <Button type="button" variant="secondary" size="sm" onClick={addUniform}>+ Add</Button>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {Object.entries(uniforms).map(([id, u]) => (
                                    <div key={id} className="flex items-center gap-2 bg-neutral-900/50 p-2 rounded-md border border-neutral-800">
                                        <Input className="h-8 text-xs flex-1" value={u.key} onChange={(e) => updateUniform(id, 'key', e.target.value)} />
                                        <Select className="h-8 text-xs w-24" value={u.type} onChange={(e) => updateUniform(id, 'type', e.target.value)}>
                                            <option value="float">Float</option>
                                            <option value="color">Color</option>
                                            <option value="vec2">Vec2</option>
                                            <option value="vec3">Vec3</option>
                                            <option value="texture">Texture</option>
                                        </Select>
                                        <Input className="h-8 text-xs w-20" type={u.type === 'float' ? 'number' : 'text'} step="0.01" value={u.value} onChange={(e) => updateUniform(id, 'value', u.type === 'float' ? parseFloat(e.target.value) : e.target.value)} />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeUniform(id)}><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-4">
                        <Button type="submit" disabled={submitting}>Create</Button>
                    </div>
                </ResourceDialogFormPanel>
                <ResourceDialogPreviewPanel className="flex-1 relative bg-black">
                    {shaderSource && (
                        <StandardShaderPreview resourceKey="preview-creation" shaderSource={shaderSource} uniforms={getFinalUniforms()} componentData={componentData} onError={(err) => setError(err ? err.message : null)} />
                    )}
                </ResourceDialogPreviewPanel>
            </ResourceDialogLayout>
        </>
    );
}
