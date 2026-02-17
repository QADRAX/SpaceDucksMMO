'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export function useResourceMutations(resourceId: string) {
    const router = useRouter();
    const [isBusy, setIsBusy] = React.useState(false);

    const setActiveVersion = React.useCallback(async (version: number) => {
        setIsBusy(true);
        try {
            const res = await fetch(`/api/admin/resources/${resourceId}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ activeVersion: version }),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error((json && (json.error as string)) || `Failed to set active version (${res.status})`);
            }
            router.refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsBusy(false);
        }
    }, [resourceId, router]);

    const deleteVersion = React.useCallback(async (version: number) => {
        const ok = confirm(`Delete version v${version}?`);
        if (!ok) return;

        setIsBusy(true);
        try {
            const res = await fetch(`/api/admin/resources/${resourceId}/versions/${version}`, {
                method: 'DELETE',
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error((json && (json.error as string)) || `Failed to delete version (${res.status})`);
            }
            router.refresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsBusy(false);
        }
    }, [resourceId, router]);

    return { setActiveVersion, deleteVersion, isBusy };
}
