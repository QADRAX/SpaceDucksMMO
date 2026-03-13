'use client';

import * as React from 'react';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Button } from '@/components/atoms/Button';
import { TrashIcon } from '@/components/icons';
import { NumberPushInput } from '@/components/molecules/NumberPushInput';
import { ResourceKeyDropdown } from '@/components/molecules/ResourceKeyDropdown';

export type UniformValue = {
    key: string;
    type: 'float' | 'vec2' | 'vec3' | 'color' | 'texture';
    value: any;
};

interface UniformItemProps {
    id: string;
    uniform: UniformValue;
    onChange: (id: string, field: string, val: any) => void;
    onRemove: (id: string) => void;
    disabled?: boolean;
}

export function UniformItem({ id, uniform, onChange, onRemove, disabled }: UniformItemProps) {
    const { key, type, value } = uniform;

    const handleValueChange = (val: any) => {
        onChange(id, 'value', val);
    };

    const handleTypeChange = (newType: UniformValue['type']) => {
        let defaultValue: any = 0;
        if (newType === 'vec2') defaultValue = [0, 0];
        else if (newType === 'vec3') defaultValue = [0, 0, 0];
        else if (newType === 'color') defaultValue = '#ffffff';
        else if (newType === 'texture') defaultValue = '';
        else if (newType === 'float') defaultValue = 1.0;

        onChange(id, 'type', newType);
        onChange(id, 'value', defaultValue);
    };

    const renderValueInput = () => {
        switch (type) {
            case 'float':
                return (
                    <div className="flex-1">
                        <NumberPushInput
                            value={typeof value === 'number' ? value : 0}
                            onChange={handleValueChange}
                            step={0.1}
                            disabled={disabled}
                        />
                    </div>
                );
            case 'vec2':
                const v2 = Array.isArray(value) ? value : [0, 0];
                return (
                    <div className="flex flex-1 gap-1">
                        <div className="flex-1">
                            <NumberPushInput
                                label="X"
                                value={v2[0]}
                                onChange={(n) => handleValueChange([n, v2[1]])}
                                step={0.1}
                                disabled={disabled}
                            />
                        </div>
                        <div className="flex-1">
                            <NumberPushInput
                                label="Y"
                                value={v2[1]}
                                onChange={(n) => handleValueChange([v2[0], n])}
                                step={0.1}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                );
            case 'vec3':
                const v3 = Array.isArray(value) ? value : [0, 0, 0];
                return (
                    <div className="flex flex-1 gap-1">
                        <div className="flex-1">
                            <NumberPushInput
                                label="X"
                                value={v3[0]}
                                onChange={(n) => handleValueChange([n, v3[1], v3[2]])}
                                step={0.1}
                                disabled={disabled}
                            />
                        </div>
                        <div className="flex-1">
                            <NumberPushInput
                                label="Y"
                                value={v3[1]}
                                onChange={(n) => handleValueChange([v3[0], n, v3[2]])}
                                step={0.1}
                                disabled={disabled}
                            />
                        </div>
                        <div className="flex-1">
                            <NumberPushInput
                                label="Z"
                                value={v3[2]}
                                onChange={(n) => handleValueChange([v3[0], v3[1], n])}
                                step={0.1}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                );
            case 'color':
                const colorValue = typeof value === 'string' ? value : '#ffffff';
                return (
                    <div className="flex flex-1 items-center gap-2">
                        <input
                            type="color"
                            value={colorValue.slice(0, 7)}
                            onChange={(e) => handleValueChange(e.target.value)}
                            disabled={disabled}
                            className="w-10 h-8 rounded border border-neutral-700 bg-neutral-800"
                        />
                        <Input
                            className="h-8 text-xs flex-1"
                            value={colorValue}
                            onChange={(e) => handleValueChange(e.target.value)}
                            disabled={disabled}
                            placeholder="#ffffff"
                        />
                    </div>
                );
            case 'texture':
                return (
                    <div className="flex-1">
                        <ResourceKeyDropdown
                            kinds={['texture']}
                            value={typeof value === 'string' ? value : null}
                            onChange={handleValueChange}
                            disabled={disabled}
                            placeholder="Select texture..."
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-2 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/50 group">
            <div className="flex items-center gap-2">
                <Input
                    className="h-8 text-xs flex-1 font-mono"
                    value={key}
                    onChange={(e) => onChange(id, 'key', e.target.value)}
                    disabled={disabled}
                    placeholder="uniformName"
                />
                <Select
                    className="h-8 text-xs w-28"
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as any)}
                    disabled={disabled}
                >
                    <option value="float">Float</option>
                    <option value="color">Color</option>
                    <option value="vec2">Vec2</option>
                    <option value="vec3">Vec3</option>
                    <option value="texture">Texture</option>
                </Select>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(id)}
                    disabled={disabled}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <TrashIcon className="w-4 h-4 text-neutral-500 hover:text-red-500" />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                {renderValueInput()}
            </div>
        </div>
    );
}
