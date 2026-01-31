import * as React from 'react';
import { Label } from '../atoms/Label';
import { cn } from '@/lib/utils';

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function FormGroup({ label, children, htmlFor, className }: FormGroupProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
