'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

function safeNumber(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

type Props = {
  value: number;
  step: number;
  disabled?: boolean;
  /** Optional label shown at the left (e.g. X/Y/Z). */
  label?: React.ReactNode;
  onChange: (next: number) => void;
  /** Called once at the end of an interaction so it becomes undo/redo-able. */
  onCommit: () => void;
};

export function NumberPushInput({ value, step, disabled, label, onChange, onCommit }: Props) {
  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const pushRef = React.useRef<{
    pointerId: number;
    direction: 1 | -1;
    startTimeMs: number;
    lastTimeMs: number;
  } | null>(null);

  const stopPush = React.useCallback(
    (commit: boolean) => {
      if (!pushRef.current) return;
      pushRef.current = null;
      if (commit && !disabled) onCommit();
    },
    [disabled, onCommit]
  );

  const pushLoop = React.useCallback(
    (nowMs: number) => {
      const st = pushRef.current;
      if (!st) return;

      const dt = Math.max(0, (nowMs - st.lastTimeMs) / 1000);
      st.lastTimeMs = nowMs;

      const elapsedMs = Math.max(0, nowMs - st.startTimeMs);
      const elapsedSec = elapsedMs / 1000;

      // Time-based push acceleration.
      const speedStepsPerSec = Math.min(80, 2 + elapsedSec * 18);
      const delta = st.direction * step * speedStepsPerSec * dt;

      const next = safeNumber(valueRef.current, 0) + delta;
      valueRef.current = next;
      onChange(next);

      window.requestAnimationFrame(pushLoop);
    },
    [onChange, step]
  );

  const startPush = React.useCallback(
    (args: { pointerId: number; direction: 1 | -1 }) => {
      if (disabled) return;

      // Stop any previous push (should be rare, but keeps things deterministic).
      pushRef.current = null;

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      pushRef.current = {
        pointerId: args.pointerId,
        direction: args.direction,
        startTimeMs: now,
        lastTimeMs: now,
      };

      // Immediate nudge so clicks feel responsive.
      const nudged = safeNumber(valueRef.current, 0) + args.direction * step;
      valueRef.current = nudged;
      onChange(nudged);

      window.requestAnimationFrame(pushLoop);
    },
    [disabled, onChange, pushLoop, step]
  );

  const onButtonPointerDown = React.useCallback(
    (direction: 1 | -1) => (e: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (typeof e.button === 'number' && e.button !== 0) return;

      const el = e.currentTarget;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      startPush({ pointerId: e.pointerId, direction });
    },
    [disabled, startPush]
  );

  const onButtonPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const st = pushRef.current;
      if (!st) return;
      if (st.pointerId !== e.pointerId) return;
      stopPush(true);
    },
    [stopPush]
  );

  const onButtonPointerCancel = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const st = pushRef.current;
      if (!st) return;
      if (st.pointerId !== e.pointerId) return;
      stopPush(true);
    },
    [stopPush]
  );

  const onInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (disabled) return;
      const n = Number(e.currentTarget.value);
      if (!Number.isFinite(n)) return;
      onChange(n);
      onCommit();
    },
    [disabled, onChange, onCommit]
  );

  return (
    <div className="grid grid-cols-[18px_32px_1fr_32px] items-center gap-2">
      <div className="text-xs font-bold text-neutral-700">{label}</div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 px-0"
        disabled={disabled}
        onPointerDown={onButtonPointerDown(-1)}
        onPointerUp={onButtonPointerUp}
        onPointerCancel={onButtonPointerCancel}
        onClick={() => {
          // click is handled by pointerdown; avoid double-step
        }}
        aria-label="Decrement (hold)"
      >
        −
      </Button>

      <Input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        onBlur={onInputBlur}
        disabled={disabled}
        className="h-8 px-2 py-1 text-xs shadow-none"
        aria-label="Value"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 px-0"
        disabled={disabled}
        onPointerDown={onButtonPointerDown(1)}
        onPointerUp={onButtonPointerUp}
        onPointerCancel={onButtonPointerCancel}
        onClick={() => {
          // click is handled by pointerdown; avoid double-step
        }}
        aria-label="Increment (hold)"
      >
        +
      </Button>
    </div>
  );
}
