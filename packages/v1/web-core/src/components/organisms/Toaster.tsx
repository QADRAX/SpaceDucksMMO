'use client';

import { useNotifications } from '@/contexts/NotificationContext';
import { Toast } from '@/components/atoms/Toast';

export function Toaster() {
    const { notifications, removeNotification } = useNotifications();

    return (
        <div className="fixed bottom-0 right-0 p-6 z-50 flex flex-col gap-2 pointer-events-none max-h-screen overflow-hidden">
            {notifications.map((notification) => (
                <Toast key={notification.id} notification={notification} onDismiss={removeNotification} />
            ))}
        </div>
    );
}
