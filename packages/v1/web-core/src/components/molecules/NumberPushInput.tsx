'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

function safeNumber(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

const STEPS = [0.001, 0.01, 0.1, 1, 10];

type Props = {
  value: number | undefined;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
  /** Optional label shown at the left (e.g. X/Y/Z). */
  label?: React.ReactNode;
  onChange: (next: number) => void;
  /** Called when the user clears the input (blank). Useful for nullable fields. */
  onClear?: () => void;
  /** Called once at the end of an interaction so it becomes undo/redo-able. */
  onCommit?: () => void; // Made optional as it has a default
  /** Called when the step size is changed via mouse wheel. */
  onStepChange?: (nextStep: number) => void;
};

import { MagnitudeGauge } from "../atoms/MagnitudeGauge";

export function NumberPushInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onCommit = () => { },
  onClear,
  onStepChange,
  unit,
  disabled
}: Props) {
  // Internal text state for the input field
  const [text, setText] = React.useState<string>(() => {
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  });

  // Local step state for immediate feedback and reliable scrolling
  const [localStep, setLocalStep] = React.useState(step);
  React.useEffect(() => {
    let nextStep = step;
    if (typeof min === 'number' && typeof max === 'number') {
      const range = Math.abs(max - min);
      if (range > 0) {
        nextStep = Math.min(nextStep, range);
      }
    }
    setLocalStep(Math.max(0.00001, nextStep));
  }, [step, min, max]);

  const isFocusedRef = React.useRef(false);
  const isInteractingRef = React.useRef(false);

  // Tracks the "live" value during continuous interaction
  const liveValueRef = React.useRef<number>(safeNumber(value, 0));

  // Comprehensive state ref to avoid stale closures in setInterval and other async logic
  const stateRef = React.useRef({ value, localStep, min, max, onChange });
  React.useLayoutEffect(() => {
    const nextVal = safeNumber(value, 0);
    stateRef.current = { value, localStep, min, max, onChange };
    if (!isInteractingRef.current) {
      liveValueRef.current = nextVal;
    }
  });

  // Sync text with external value changes
  React.useEffect(() => {
    if (isFocusedRef.current || isInteractingRef.current) return;
    setText(typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
  }, [value]);

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const performStep = React.useCallback(
    (direction: 1 | -1) => {
      const { localStep: cStep, min: cMin, max: cMax, onChange: cOnChange } = stateRef.current;

      // Calculate precision based on step
      const stepStr = String(cStep);
      const decimalPlaces = stepStr.indexOf('.') !== -1 ? stepStr.split('.')[1].length : 0;
      const precision = Math.max(decimalPlaces, 4);

      let next = liveValueRef.current + direction * cStep;

      // Fix floating point math
      next = parseFloat(next.toFixed(precision));

      // Clamp
      if (typeof cMin === 'number') next = Math.max(cMin, next);
      if (typeof cMax === 'number') next = Math.min(cMax, next);

      liveValueRef.current = next;
      cOnChange(next);
      setText(String(next));
    },
    []
  );

  const stopRepeating = React.useCallback((e?: React.PointerEvent) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;

    if (isInteractingRef.current) {
      isInteractingRef.current = false;
      onCommit();
    }
  }, [onCommit]);

  const startRepeating = React.useCallback(
    (direction: 1 | -1) => {
      if (disabled) return;
      isInteractingRef.current = true;
      liveValueRef.current = safeNumber(stateRef.current.value, 0);

      // Perform first step immediately
      performStep(direction);

      // Initial delay then fast repeat
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          performStep(direction);
        }, 50);
      }, 400);
    },
    [disabled, performStep]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      performStep(1);
      onCommit();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      performStep(-1);
      onCommit();
    }
  };

  const onBlur = () => {
    isFocusedRef.current = false;
    if (disabled) return;

    const trimmed = text.trim();
    if (trimmed === '') {
      onClear?.();
      onCommit();
      return;
    }

    let n = Number(trimmed);
    if (Number.isFinite(n)) {
      // Clamp on blur too
      if (typeof min === 'number') n = Math.max(min, n);
      if (typeof max === 'number') n = Math.min(max, n);

      if (n !== value) {
        onChange(n);
        onCommit();
      }
      setText(String(n));
      liveValueRef.current = n;
    } else {
      // Revert to current value if invalid
      setText(typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
    }
  };

  // Logarithmic step changing via scroll wheel
  const lastWheelTimeRef = React.useRef(0);
  const WHEEL_COOLDOWN = 150; // ms between discrete step jumps
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Overlay state for showing step changes
  const [overlayStep, setOverlayStep] = React.useState<number | null>(null);
  const overlayTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled || !onStepChange) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent scrolling parent while hovering
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - lastWheelTimeRef.current < WHEEL_COOLDOWN) return;
      lastWheelTimeRef.current = now;

      const direction = e.deltaY > 0 ? -1 : 1;
      const { localStep: currentLocalStep, min: cMin, max: cMax } = stateRef.current;

      // Calculate range-based max step
      let allowedMaxStep = 100000;
      if (typeof cMin === 'number' && typeof cMax === 'number') {
        const range = Math.abs(cMax - cMin);
        if (range > 0) {
          allowedMaxStep = Math.min(100000, range);
        }
      }

      let nextStep = direction > 0 ? currentLocalStep * 10 : currentLocalStep / 10;

      // Clamp between 0.00001 and the allowed maximum
      nextStep = Math.max(0.00001, Math.min(allowedMaxStep, nextStep));
      nextStep = parseFloat(nextStep.toPrecision(12));

      if (nextStep !== currentLocalStep) {
        setLocalStep(nextStep);
        onStepChange(nextStep);
        setOverlayStep(nextStep);
        if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = setTimeout(() => {
          setOverlayStep(null);
        }, 1500); // Slightly longer to appreciate the animation
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [disabled, onStepChange]);

  return (
    <div
      ref={containerRef}
      className="group relative flex h-8 items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-0.5 transition-colors focus-within:border-primary/30 focus-within:bg-white hover:border-neutral-300"
    >
      <MagnitudeGauge activeMagnitude={overlayStep || 0} isVisible={overlayStep !== null} />

      {label && (
        <div className="flex w-5 shrink-0 items-center justify-center text-[10px] font-bold text-neutral-400 select-none">
          {label}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        className="h-full w-6 shrink-0 rounded-[4px] p-0 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-30"
        disabled={disabled}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          startRepeating(-1);
        }}
        onPointerUp={stopRepeating}
        onPointerCancel={stopRepeating}
        tabIndex={-1}
      >
        <span className="text-xs">−</span>
      </Button>

      <div className="relative flex flex-1 items-center">
        <Input
          type="text"
          value={text}
          disabled={disabled}
          className="h-full w-full border-none bg-transparent px-1 py-0 text-center text-xs shadow-none outline-none focus-visible:ring-0"
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onChange={(e) => {
            const val = e.target.value;
            setText(val);
            const n = Number(val);
            if (val.trim() !== '' && Number.isFinite(n)) {
              onChange(n);
            }
          }}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        {unit && !isFocusedRef.current && (
          <div className="pointer-events-none absolute right-1 text-[10px] text-neutral-400">
            {unit}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="h-full w-6 shrink-0 rounded-[4px] p-0 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-30"
        disabled={disabled}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          startRepeating(1);
        }}
        onPointerUp={stopRepeating}
        onPointerCancel={stopRepeating}
        tabIndex={-1}
      >
        <span className="text-xs">+</span>
      </Button>
    </div>
  );
}
