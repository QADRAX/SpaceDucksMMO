import { OpenAPI } from '@duckengine/web-core-api-client';

// Configure the base URL if necessary. 
// Since we are running in the same Next.js app, relative paths work fine for browser-side calls.
// However, if we need to call it from server components, we might need a full URL.
// For now, we assume client-side usage or proxy handling.
OpenAPI.BASE = '';

export { AdminService, ResourcesService } from '@duckengine/web-core-api-client';

export type CreateResourceWithZipRequest = {
    kind: string;
    key: string;
    displayName: string;
    zip: File;
};

export async function createResourceWithZip(data: CreateResourceWithZipRequest) {
    const form = new FormData();
    form.set('zip', data.zip);

    const res = await fetch('/api/admin/resources', {
        method: 'POST',
        body: form,
    });

    if (!res.ok) {
        const json = await res.json().catch(() => null);
        const msg = (json && (json.error as string)) || `Failed to create resource (${res.status})`;
        throw new Error(msg);
    }

    return res.json();
}

export type UpdateResourceVersionRequest = {
    resourceId: string;
    version: number;
    componentData: Record<string, unknown>;
    files: Record<string, File>;
};

export async function updateResourceVersionWithFiles(data: UpdateResourceVersionRequest) {
    const form = new FormData();
    form.set('componentData', JSON.stringify(data.componentData, null, 2));

    for (const [key, file] of Object.entries(data.files)) {
        form.set(key, file);
    }

    const res = await fetch(`/api/admin/resources/${data.resourceId}/versions/${data.version}`, {
        method: 'PATCH',
        body: form,
    });

    if (!res.ok) {
        const json = await res.json().catch(() => null);
        const msg = (json && (json.error as string)) || `Failed to update version (${res.status})`;
        throw new Error(msg);
    }

    return res.json();
}
