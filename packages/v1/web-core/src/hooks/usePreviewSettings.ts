'use client';

import * as React from 'react';

/**
 * Generic hook to manage preview settings that are persisted to localStorage
 * and synced across tabs/windows.
 */
export function usePreviewSettings<T>(
    resourceKey: string,
    storageKeyPrefix: string,
    defaultSettings: T,
    validator: (raw: unknown) => T | null
): [T, React.Dispatch<React.SetStateAction<T>>] {

    const getStorageKey = (key: string) => {
        const normalized = key.trim() || 'draft';
        return `${storageKeyPrefix}.${normalized}.v1`;
    };

    const getEventKey = (key: string) => {
        const normalized = key.trim() || 'draft';
        return `webcore:previewSettingsChanged:${storageKeyPrefix}:${normalized}`;
    };

    const loadSettings = React.useCallback(
        (key: string): T => {
            if (typeof window === 'undefined') return defaultSettings;
            try {
                const raw = window.localStorage.getItem(getStorageKey(key));
                if (!raw) return defaultSettings;
                const parsed = JSON.parse(raw);
                return validator(parsed) ?? defaultSettings;
            } catch {
                return defaultSettings;
            }
        },
        [defaultSettings, validator, storageKeyPrefix] // Added storageKeyPrefix to deps (though usually static)
    );

    const [settings, setSettings] = React.useState<T>(() => loadSettings(resourceKey));
    const lastPersistedJsonRef = React.useRef<string | null>(null);

    // Load when resourceKey changes
    React.useEffect(() => {
        setSettings(loadSettings(resourceKey));
        lastPersistedJsonRef.current = null;
    }, [resourceKey, loadSettings]);

    // Sync across tabs/windows
    React.useEffect(() => {
        const storageKey = getStorageKey(resourceKey);
        const eventKey = getEventKey(resourceKey);

        const onChanged = () => {
            setSettings((prev) => {
                const next = loadSettings(resourceKey);
                try {
                    return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
                } catch {
                    return next;
                }
            });
        };

        const onStorage = (e: StorageEvent) => {
            if (!e.key) return;
            if (e.key !== storageKey) return;
            onChanged();
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener(eventKey, onChanged as any);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(eventKey, onChanged as any);
        };
    }, [resourceKey, loadSettings, storageKeyPrefix]);

    // Persist changes
    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        let json: string;
        try {
            json = JSON.stringify(settings);
        } catch {
            json = '';
        }

        if (json && lastPersistedJsonRef.current === json) {
            // no-op
        } else {
            lastPersistedJsonRef.current = json || null;
            try {
                window.localStorage.setItem(getStorageKey(resourceKey), json);
                window.dispatchEvent(new Event(getEventKey(resourceKey)));
            } catch {
                // ignore
            }
        }
    }, [settings, resourceKey, storageKeyPrefix]);

    return [settings, setSettings];
}
