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
import { PhysicalShaderPreview } from '@/components/molecules/previews/PhysicalShaderPreview';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { UniformItem } from '@/components/molecules/resource-ui/UniformItem';
import { PhysicalShaderMaterialComponent } from '@duckengine/core';

export function CreatePhysicalShaderDialog() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);

    const [key, setKey] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');
    const [shaderFile, setShaderFile] = React.useState<File | null>(null);

    const [shaderSource, setShaderSource] = React.useState<string | undefined>();
    const [uniforms, setUniforms] = React.useState<Record<string, any>>({});
    const [componentData, setComponentData] = React.useState<Record<string, any>>({
        roughness: 0.4,
        metalness: 0.5,
        clearcoat: 0.0,
        transmission: 0.0,
        ior: 1.5,
        thickness: 0.0,
        transparent: false,
        depthWrite: true,
        blending: 'normal'
    });

    const inspectorFields = React.useMemo(() => {
        const comp = new PhysicalShaderMaterialComponent({ shaderId: 'fake' });
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
        setComponentData({ roughness: 0.5, metalness: 0.0, clearcoat: 0.0, transmission: 0.0, ior: 1.5, thickness: 0.0, transparent: false, depthWrite: true, blending: 'normal' });
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
        Object.entries(uniforms).forEach(([id, u]) => {
            if (u.key.trim()) {
                result[id] = { key: u.key.trim(), value: u.value, type: u.type };
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

        const wgslRegex = /\bfn\s+\w+\s*\(([^)]*)\)/g;
        const glslRegex = /(?:vec[234]|float|void)\s+\w+\s*\(([^)]*)\)/g;

        const nextUniforms = { ...uniforms };
        let added = false;

        const processArgString = (argString: string) => {
            const args = argString.split(',').map(a => a.trim());
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

                const standardKeys = ['uv', 'time', 'cameraPosition', 'screenSize', 'normalLocal', 'normalView', 'positionLocal', 'positionView'];
                if (key && !standardKeys.includes(key)) {
                    let type: any = 'float';
                    if (typeStr.includes('vec2')) type = 'vec2';
                    else if (typeStr.includes('vec3')) {
                        const lowerKey = key.toLowerCase();
                        if (lowerKey.includes('color') || lowerKey.includes('tint')) type = 'color';
                        else type = 'vec3';
                    }
                    else if (typeStr.includes('vec4')) type = 'vec4';
                    else if (typeStr.includes('color')) type = 'color';

                    const existingIdx = Object.values(nextUniforms).findIndex((u: any) => u.key === key);
                    if (existingIdx === -1) {
                        const id = `u_auto_${key}`;
                        nextUniforms[id] = {
                            key,
                            type,
                            value: type === 'color' ? '#ffffff' : (type === 'float' ? 1.0 : (type === 'vec2' ? [0, 0] : [0, 0, 0]))
                        };
                        added = true;
                    } else {
                        // Update type if it was generic before or detected as color now
                        const existingId = Object.keys(nextUniforms)[existingIdx];
                        if (nextUniforms[existingId].type !== type && (nextUniforms[existingId].type === 'vec3' || nextUniforms[existingId].type === 'float')) {
                            nextUniforms[existingId].type = type;
                            if (type === 'color' && typeof nextUniforms[existingId].value !== 'string') {
                                nextUniforms[existingId].value = '#ffffff';
                            }
                            added = true;
                        }
                    }
                }
            });
        };

        let match;
        while ((match = wgslRegex.exec(clean)) !== null) processArgString(match[1]);
        while ((match = glslRegex.exec(clean)) !== null) processArgString(match[1]);

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
        if (!key.trim() || !displayName.trim()) { setError('Key and Display Name are required.'); return; }
        if (!shaderFile) { setError('A shader file is required.'); return; }

        setSubmitting(true);
        try {
            const extension = shaderFile.name.split('.').pop();
            const zipBlob = await createUploadZip({
                kind: 'physicalShaderMaterial',
                key: key.trim(),
                displayName: displayName.trim(),
                componentData: {
                    ...componentData,
                    uniforms: getFinalUniforms(),
                },
            }, { [`shader.${extension}`]: shaderFile });

            const zipFile = new File([zipBlob], `${key.trim()}.zip`, { type: 'application/zip' });
            await createResourceWithZip({
                kind: 'physicalShaderMaterial',
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
            <Button type="button" onClick={() => setOpen(true)}>+ Create physical shader</Button>
            <ResourceDialogLayout open={open} onOpenChange={setOpen} title="Create Physical Shader Material" onClose={() => setOpen(false)}>
                <ResourceDialogFormPanel onSubmit={onSubmit} error={error}>
                    <ResourceKeyInput value={key} onChange={setKey} placeholder="shaders/phys-sample" disabled={submitting} />
                    <ResourceDisplayNameInput value={displayName} onChange={setDisplayName} placeholder="My Physical Shader" disabled={submitting} />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Shader File</Label>
                            <input type="file" accept=".glsl,.wgsl,.tsl" onChange={(e) => setShaderFile(e.target.files?.[0] ?? null)} disabled={submitting} className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground" />
                        </div>

                        <div className="space-y-4 pt-2 border-t border-neutral-800">
                            <Label>Advanced PBR Properties</Label>
                            <EcsInspectorFieldsForm fields={inspectorFields} value={componentData} onChange={setComponentData} disabled={submitting} />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-neutral-800">
                            <div className="flex items-center justify-between">
                                <Label>Uniforms</Label>
                                <div className="flex gap-2">
                                    <Button type="button" variant="secondary" size="sm" onClick={detectUniformsFromSource} disabled={submitting || !shaderSource}>Auto-detect</Button>
                                    <Button type="button" variant="secondary" size="sm" onClick={addUniform}>+ Add</Button>
                                </div>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {Object.entries(uniforms).map(([id, u]) => (
                                    <UniformItem
                                        key={id}
                                        id={id}
                                        uniform={u}
                                        onChange={updateUniform}
                                        onRemove={removeUniform}
                                        disabled={submitting}
                                    />
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
                        <PhysicalShaderPreview resourceKey="preview-creation" shaderSource={shaderSource} uniforms={getFinalUniforms()} componentData={componentData} onError={(err) => setError(err ? err.message : null)} />
                    )}
                </ResourceDialogPreviewPanel>
            </ResourceDialogLayout>
        </>
    );
}
