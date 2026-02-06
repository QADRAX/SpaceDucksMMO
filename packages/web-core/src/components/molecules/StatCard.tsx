import * as React from 'react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="text-4xl font-heading text-main mb-2">{value}</div>
      <div className="text-sm text-neutral-600 font-base">{label}</div>
    </Card>
  );
}
