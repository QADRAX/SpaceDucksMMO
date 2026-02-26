'use client';

import * as React from 'react';

import type { Entity } from '@duckengine/core';

import { NumberPushInput } from '@/components/molecules/NumberPushInput';
import {
  getRememberedStep,
  setRememberedStep
} from '../organisms/SceneEditor/ui/inspectorUiMemory';

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function safeNumber(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

type Vec3 = { x: number; y: number; z: number };

type Axis = keyof Vec3;

type Props = {
  entity: Entity;
  disabled?: boolean;
  /** Called when the user finishes an interaction so it becomes undo/redo-able. */
  onCommit: (reason: string) => void;
};

export function TransformEditor({ entity, disabled, onCommit }: Props) {
  const transform = entity.transform;
  const selectionKey = entity.id;

  const [pos, setPos] = React.useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [rotDeg, setRotDeg] = React.useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = React.useState<Vec3>({ x: 1, y: 1, z: 1 });

  const isInteractingRef = React.useRef(false);

  // Helper for step sizes
  const getStep = (field: string, defaultValue: number) => {
    return getRememberedStep(selectionKey, field) ?? defaultValue;
  };

  const setStep = (field: string, step: number) => {
    setRememberedStep(selectionKey, field, step);
  };

  const commit = React.useCallback(
    (reason: string) => {
      if (disabled) return;
      onCommit(reason);
    },
    [disabled, onCommit]
  );

  const readFromTransform = React.useCallback(() => {
    const p = transform.localPosition as any;
    const r = transform.localRotation as any;
    const s = transform.localScale as any;

    setPos({
      x: safeNumber(p?.x, 0),
      y: safeNumber(p?.y, 0),
      z: safeNumber(p?.z, 0),
    });
    setRotDeg({
      x: toDegrees(safeNumber(r?.x, 0)),
      y: toDegrees(safeNumber(r?.y, 0)),
      z: toDegrees(safeNumber(r?.z, 0)),
    });
    setScale({
      x: safeNumber(s?.x, 1),
      y: safeNumber(s?.y, 1),
      z: safeNumber(s?.z, 1),
    });
  }, [transform]);

  React.useEffect(() => {
    readFromTransform();

    const onChange = () => {
      // While the user is actively dragging controls, keep the UI as the source of truth.
      if (isInteractingRef.current) return;
      readFromTransform();
    };

    transform.onChange(onChange);
    return () => {
      try {
        transform.removeOnChange(onChange);
      } catch {
        // ignore
      }
    };
  }, [readFromTransform, transform]);

  const posRef = React.useRef(pos);
  const rotDegRef = React.useRef(rotDeg);
  const scaleRef = React.useRef(scale);
  React.useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  React.useEffect(() => {
    rotDegRef.current = rotDeg;
  }, [rotDeg]);
  React.useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const setPosAxis = React.useCallback(
    (axis: Axis, n: number) => {
      const current = posRef.current;
      const next = { ...current, [axis]: Number.isFinite(n) ? n : 0 };
      setPos(next);
      transform.setPosition(next.x, next.y, next.z);
    },
    [transform]
  );

  const setRotAxisDeg = React.useCallback(
    (axis: Axis, deg: number) => {
      const current = rotDegRef.current;
      const next = { ...current, [axis]: Number.isFinite(deg) ? deg : 0 };
      setRotDeg(next);
      transform.setRotation(toRadians(next.x), toRadians(next.y), toRadians(next.z));
    },
    [transform]
  );

  const setScaleAxis = React.useCallback(
    (axis: Axis, n: number) => {
      const current = scaleRef.current;
      const next = { ...current, [axis]: Number.isFinite(n) ? n : 1 };
      setScale(next);
      transform.setScale(next.x, next.y, next.z);
    },
    [transform]
  );

  const beginInteraction = React.useCallback(() => {
    isInteractingRef.current = true;
  }, []);

  const endInteraction = React.useCallback(
    (reason: string) => {
      isInteractingRef.current = false;
      commit(reason);
    },
    [commit]
  );

  return (
    <div
      className="space-y-3"
      onPointerDown={() => beginInteraction()}
    >
      <div className="space-y-2">
        <div className="font-bold">Transform</div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-neutral-700">Position</div>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <NumberPushInput
              key={`pos-${axis}`}
              label={axis.toUpperCase()}
              value={pos[axis]}
              step={getStep(`transform.pos.${axis}`, 0.1)}
              unit="m"
              disabled={disabled}
              onChange={(n) => setPosAxis(axis, n)}
              onCommit={() => endInteraction(`transform-pos-${axis}`)}
              onStepChange={(s) => setStep(`transform.pos.${axis}`, s)}
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-neutral-700">Rotation (deg)</div>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <NumberPushInput
              key={`rot-${axis}`}
              label={axis.toUpperCase()}
              value={rotDeg[axis]}
              step={getStep(`transform.rot.${axis}`, 1)}
              unit="deg"
              disabled={disabled}
              onChange={(n) => setRotAxisDeg(axis, n)}
              onCommit={() => endInteraction(`transform-rot-${axis}`)}
              onStepChange={(s) => setStep(`transform.rot.${axis}`, s)}
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-neutral-700">Scale</div>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <NumberPushInput
              key={`scale-${axis}`}
              label={axis.toUpperCase()}
              value={scale[axis]}
              step={getStep(`transform.scale.${axis}`, 0.01)}
              disabled={disabled}
              onChange={(n) => setScaleAxis(axis, n)}
              onCommit={() => endInteraction(`transform-scale-${axis}`)}
              onStepChange={(s) => setStep(`transform.scale.${axis}`, s)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
