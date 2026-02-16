'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

function safeNumber(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

type Props = {
  value: number | undefined;
  step: number;
  disabled?: boolean;
  /** Optional label shown at the left (e.g. X/Y/Z). */
  label?: React.ReactNode;
  onChange: (next: number) => void;
  /** Called when the user clears the input (blank). Useful for nullable fields. */
  onClear?: () => void;
  /** Called once at the end of an interaction so it becomes undo/redo-able. */
  onCommit: () => void;
};

export function NumberPushInput({ value, step, disabled, label, onChange, onClear, onCommit }: Props) {
  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const focusedRef = React.useRef(false);

  const [text, setText] = React.useState<string>(() => {
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  });

  React.useEffect(() => {
    // Keep display in sync with external value changes, but don't clobber
    // the user's in-progress typing while the input is focused.
    const next = typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
    const pushing = !!pushRef.current;
    if (!focusedRef.current || pushing) setText(next);
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
      setText(String(next));

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
      setText(String(nudged));

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

  const onInputBlur = React.useCallback(() => {
    focusedRef.current = false;
    if (disabled) return;

    const raw = text.trim();
    if (!raw.length) {
      onClear?.();
      onCommit();
      return;
    }

    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange(n);
    onCommit();
  }, [disabled, onChange, onClear, onCommit, text]);

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
        ref={inputRef}
        type="number"
        step={step}
        value={text}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          setText(raw);
          if (!raw.length) return;
          const n = Number(raw);
          if (!Number.isFinite(n)) return;
          onChange(n);
        }}
        onBlur={() => onInputBlur()}
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
