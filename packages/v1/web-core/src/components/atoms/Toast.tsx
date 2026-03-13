'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { type Notification, type NotificationType } from '@/contexts/NotificationContext';

const typeStyles: Record<NotificationType, string> = {
    success: 'bg-green-100 border-green-300 text-green-800',
    error: 'bg-red-100 border-red-300 text-red-800',
    info: 'bg-blue-100 border-blue-300 text-blue-800',
    warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
};

interface ToastProps {
    notification: Notification;
    onDismiss: (id: string) => void;
}

export function Toast({ notification, onDismiss }: ToastProps) {
    return (
        <div
            className={cn(
                'relative flex items-center justify-between gap-4 p-4 rounded-base border-2 shadow-sm w-full max-w-sm pointer-events-auto transition-all animate-in slide-in-from-right-full fade-in',
                typeStyles[notification.type]
            )}
            role="alert"
        >
            <div className="text-sm font-medium">{notification.message}</div>
            <button
                onClick={() => onDismiss(notification.id)}
                className="shrink-0 rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            </button>
        </div>
    );
}
