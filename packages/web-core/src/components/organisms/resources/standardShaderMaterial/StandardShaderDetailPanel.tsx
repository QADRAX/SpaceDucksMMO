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
import { StandardShaderPreview } from '@/components/molecules/previews/StandardShaderPreview';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { TrashIcon } from '@/components/icons';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { StandardShaderMaterialComponent } from '@duckengine/ecs';

import { VersionSummary } from '../types';

type ResourceSummary = { id: string; kind: 'standardShaderMaterial'; activeVersion: number };

export function StandardShaderDetailPanel({ resource, versions }: { resource: ResourceSummary; versions: VersionSummary[] }) {
    const { setActiveVersion, deleteVersion, isBusy } = useResourceMutations(resource.id);

    const [creatingOpen, setCreatingOpen] = React.useState(false);
    const [shaderFile, setShaderFile] = React.useState<File | null>(null);
    const [shaderSource, setShaderSource] = React.useState<string>('// No source loaded');
    const [uniforms, setUniforms] = React.useState<Record<string, any>>({});
    const [componentData, setComponentData] = React.useState<Record<string, any>>({});

    const activeVersion = React.useMemo(() => versions.find((v) => v.version === resource.activeVersion) ?? versions[0] ?? null, [versions, resource.activeVersion]);

    const inspectorFields = React.useMemo(() => {
        const comp = new StandardShaderMaterialComponent({ shaderId: 'fake' });
        return comp.metadata.inspector?.fields.filter(f => f.key !== 'shaderId' && !f.key.startsWith('u_')) ?? [];
    }, []);

    React.useEffect(() => {
        if (!activeVersion) return;
        try {
            const data = JSON.parse(activeVersion.componentData || '{}');
            setComponentData(data);
            if (data.uniforms) {
                const mapped: Record<string, any> = {};
                Object.entries(data.uniforms).forEach(([k, u]: [string, any]) => {
                    mapped[`u_init_${k}`] = { key: k, value: u.value, type: u.type };
                });
                setUniforms(mapped);
            } else { setUniforms({}); }
        } catch (e) { console.error(e); }

        const binding = activeVersion.bindings.find(b => b.slot === 'shader' || b.fileName.match(/\.(glsl|wgsl|tsl)$/i));
        if (binding) {
            fetch(`/api/admin/assets/content/${binding.fileAssetId}`).then(res => res.text()).then(setShaderSource).catch(console.error);
        }
    }, [activeVersion]);

    const { submitting, setSubmitting, error, setError } = useFormState();
    const router = useRouter();

    const addUniform = () => { setUniforms(prev => ({ ...prev, [`u_${Date.now()}`]: { key: '', value: 0.5, type: 'float' } })); };
    const removeUniform = (id: string) => { setUniforms(prev => { const next = { ...prev }; delete next[id]; return next; }); };
    const updateUniform = (id: string, field: string, val: any) => { setUniforms(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } })); };
    const getFinalUniforms = () => {
        const result: Record<string, any> = {};
        Object.values(uniforms).forEach(u => { if (u.key.trim()) result[u.key.trim()] = { value: u.value, type: u.type }; });
        return result;
    };

    const submitNewVersion = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const isWgsl = /\bfn\s+\w+\s*\(/.test(shaderSource) || shaderSource.includes('->');
            const ext = isWgsl ? 'wgsl' : 'glsl';
            const finalShaderFile = shaderFile || new File([new Blob([shaderSource], { type: 'text/plain' })], `shader.${ext}`);

            const zipBlob = await createUploadZip({
                kind: resource.kind,
                componentData: { ...componentData, uniforms: getFinalUniforms() },
            }, { [`shader.${ext}`]: finalShaderFile });

            const zipFile = new File([zipBlob], `std-${resource.id}.zip`, { type: 'application/zip' });
            await AdminService.postApiAdminResourcesVersions(resource.id, { zip: zipFile });

            setCreatingOpen(false);
            router.refresh();
        } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); setSubmitting(false); }
    };

    return (
        <div className="h-full min-h-0 flex flex-col">
            <ResourceDetailHeader title="Versions" activeVersion={resource.activeVersion} totalVersions={versions.length} onAction={() => setCreatingOpen(true)} />
            <section className="flex-1 min-h-0">
                <ResourceVersionsTable versions={versions} activeVersion={resource.activeVersion} onSetActive={setActiveVersion} onDelete={deleteVersion} deleteDisabled={(v) => versions.length <= 1 || resource.activeVersion === v.version || isBusy} containerClassName="h-full" />
            </section>

            <ResourceDialogLayout open={creatingOpen} onOpenChange={setCreatingOpen} onClose={() => setCreatingOpen(false)} title="New Standard Shader Version" fullscreen={true} className="max-w-7xl">
                <div className="flex h-full w-full bg-neutral-900 overflow-hidden">
                    <ResourceDialogFormPanel onSubmit={submitNewVersion} error={error} className="w-[450px] shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col overflow-y-auto">
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Shader File</Label>
                                <input type="file" accept=".glsl,.tsl,.wgsl" onChange={(e) => setShaderFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground" />
                            </div>
                            <div className="space-y-4 pt-4 border-t border-neutral-800">
                                <Label>Material Properties</Label>
                                <EcsInspectorFieldsForm fields={inspectorFields} value={componentData} onChange={setComponentData} disabled={submitting} />
                            </div>
                            <div className="space-y-3 pt-4 border-t border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <Label>Uniforms</Label>
                                    <Button type="button" variant="secondary" size="sm" onClick={addUniform}>+ Add</Button>
                                </div>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                    {Object.entries(uniforms).map(([id, u]) => (
                                        <div key={id} className="flex items-center gap-2 bg-neutral-900 p-2 rounded-md border border-neutral-800">
                                            <Input className="h-8 text-xs flex-1" value={u.key} onChange={(e) => updateUniform(id, 'key', e.target.value)} />
                                            <Select className="h-8 text-xs w-24" value={u.type} onChange={(e) => updateUniform(id, 'type', e.target.value)}>
                                                <option value="float">Float</option><option value="color">Color</option><option value="vec2">Vec2</option><option value="vec3">Vec3</option>
                                            </Select>
                                            <Input className="h-8 text-xs w-20" type={u.type === 'float' ? 'number' : 'text'} step="0.01" value={u.value} onChange={(e) => updateUniform(id, 'value', u.type === 'float' ? parseFloat(e.target.value) : e.target.value)} />
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeUniform(id)}><TrashIcon className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-neutral-800 flex justify-end">
                            <Button type="submit" disabled={submitting}>Create version</Button>
                        </div>
                    </ResourceDialogFormPanel>
                    <ResourceDialogPreviewPanel className="flex-1 relative">
                        <StandardShaderPreview resourceKey={`std-${resource.id}`} shaderSource={shaderSource} uniforms={getFinalUniforms()} componentData={componentData} onError={(err) => setError(err ? err.message : null)} />
                    </ResourceDialogPreviewPanel>
                </div>
            </ResourceDialogLayout>
        </div>
    );
}
