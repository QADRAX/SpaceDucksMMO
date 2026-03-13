'use client';

import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';

type SharedInputProps = {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
};

export function ResourceKeyInput({ value, onChange, disabled, placeholder }: SharedInputProps & { placeholder?: string }) {
    return (
        <div className="space-y-2">
            <Label>Key</Label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
            />
            <p className="text-xs text-neutral-600">Unique stable id. Used by the engine.</p>
        </div>
    );
}

export function ResourceDisplayNameInput({ value, onChange, disabled, placeholder }: SharedInputProps & { placeholder?: string }) {
    return (
        <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
            />
        </div>
    );
}
