'use client';

import * as React from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
}

interface NotificationContextValue {
    notifications: Notification[];
    notify: (message: string, type?: NotificationType, duration?: number) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);

    const removeNotification = React.useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const notify = React.useCallback(
        (message: string, type: NotificationType = 'info', duration = 5000) => {
            const id = Math.random().toString(36).substring(2, 9);
            const output: Notification = { id, message, type, duration };
            setNotifications((prev) => [...prev, output]);

            if (duration > 0) {
                setTimeout(() => {
                    removeNotification(id);
                }, duration);
            }
        },
        [removeNotification]
    );

    const value = React.useMemo(
        () => ({ notifications, notify, removeNotification }),
        [notifications, notify, removeNotification]
    );

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
    const context = React.useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
