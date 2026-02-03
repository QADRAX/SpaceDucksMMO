import { useEffect, useState } from "preact/hooks";
import type { Entity } from "@duckengine/rendering-three/ecs";
import { useI18n } from '../../../hooks/useI18n';
import { useServices } from '../../../hooks/useServices';
import { TransformGroup } from '../../common/molecules/TransformGroup';
import { Vector3Input } from '../../common/molecules/Vector3Input';
import { ToggleSwitch } from '../../common/atoms/ToggleSwitch';

type Props = { entity?: Entity };

export function TransformEditor({ entity }: Props) {
  const services = useServices();
  const { t } = useI18n();
  const transform = entity?.transform;

  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
  const [transformDebugEnabled, setTransformDebugEnabled] = useState<boolean>(() =>
    !!entity?.isDebugTransformEnabled()
  );
  const [meshDebugEnabled, setMeshDebugEnabled] = useState<boolean>(() =>
    typeof (entity as any)?.isDebugMeshEnabled === 'function' ? !!(entity as any).isDebugMeshEnabled() : false
  );
  const [colliderDebugEnabled, setColliderDebugEnabled] = useState<boolean>(() =>
    !!entity?.isDebugColliderEnabled()
  );

  useEffect(() => {
    if (!transform) return;
    const update = () => {
      const p = transform.localPosition;
      const r = transform.localRotation;
      const s = transform.localScale;
      setPos({ x: p.x, y: p.y, z: p.z });
      setRot({ x: r.x, y: r.y, z: r.z });
      setScale({ x: s.x, y: s.y, z: s.z });
    };
    update();
    transform.onChange(update);
    return () => {
      try {
        transform.removeOnChange(update);
      } catch {}
    };
  }, [transform]);

  useEffect(() => {
    if (!entity) return;
    const listener = (enabled: boolean) => setTransformDebugEnabled(!!enabled);
    try {
      entity.addDebugTransformListener(listener);
      setTransformDebugEnabled(!!entity.isDebugTransformEnabled());
    } catch {}
    return () => {
      try {
        entity.removeDebugTransformListener(listener);
      } catch {}
    };
  }, [entity]);

  useEffect(() => {
    if (!entity) return;
    if (typeof (entity as any).addDebugMeshListener !== 'function') {
      setMeshDebugEnabled(false);
      return;
    }
    const listener = (enabled: boolean) => setMeshDebugEnabled(!!enabled);
    try {
      (entity as any).addDebugMeshListener(listener);
      setMeshDebugEnabled(
        typeof (entity as any).isDebugMeshEnabled === 'function' ? !!(entity as any).isDebugMeshEnabled() : false
      );
    } catch {}
    return () => {
      try {
        (entity as any).removeDebugMeshListener(listener);
      } catch {}
    };
  }, [entity]);

  useEffect(() => {
    if (!entity) return;
    const listener = (enabled: boolean) => setColliderDebugEnabled(!!enabled);
    try {
      entity.addDebugColliderListener(listener);
      setColliderDebugEnabled(!!entity.isDebugColliderEnabled());
    } catch {}
    return () => {
      try {
        entity.removeDebugColliderListener(listener);
      } catch {}
    };
  }, [entity]);

  if (!entity || !transform)
    return (
      <div className="small-label">{t("inspector.noEntitySelected", "No entity selected")}</div>
    );

  return (
    <div className="component-section">
      <div className="component-header">
        <strong>{t("inspector.transform", "Transform")}</strong>
      </div>
      <div style={{ padding: '6px 8px' }}>
        <ToggleSwitch
          checked={transformDebugEnabled}
          onChange={(v) => {
            try {
              if (v) services.sceneManager?.setSceneDebugEnabled?.(true);
              entity?.setDebugTransformEnabled(v);
            } catch {}
            setTransformDebugEnabled(v);
          }}
          label={t('inspector.entityTransformDebug', 'Show Transform Debug')}
        />
      </div>
      <div style={{ padding: '0px 8px 6px' }}>
        <ToggleSwitch
          checked={meshDebugEnabled}
          onChange={(v) => {
            try {
              if (v) services.sceneManager?.setSceneMeshDebugEnabled?.(true);
              if (typeof (entity as any)?.setDebugMeshEnabled === 'function') (entity as any).setDebugMeshEnabled(v);
            } catch {}
            setMeshDebugEnabled(v);
          }}
          label={t('inspector.entityMeshDebug', 'Show Mesh Debug')}
        />
      </div>
      <div style={{ padding: '0px 8px 6px' }}>
        <ToggleSwitch
          checked={colliderDebugEnabled}
          onChange={(v) => {
            if (v) services.sceneManager?.setSceneColliderDebugEnabled?.(true);
            entity?.setDebugColliderEnabled(v);
            setColliderDebugEnabled(v);
          }}
          label={t('inspector.entityColliderDebug', 'Show Collider Debug')}
        />
      </div>
      <div style={{ paddingTop: 6 }}>
        <TransformGroup label={t("inspector.position", "Position")}>
          <Vector3Input
            value={pos}
            onChange={(axis, v) => {
              const next = { ...pos, [axis]: v };
              setPos(next);
              transform.setPosition(next.x, next.y, next.z);
            }}
            step={0.01}
          />
        </TransformGroup>

        <TransformGroup label={t("inspector.rotation", "Rotation")}>
          <Vector3Input
            value={rot}
            onChange={(axis, v) => {
              const next = { ...rot, [axis]: v };
              setRot(next);
              transform.setRotation(next.x, next.y, next.z);
            }}
            step={0.01}
          />
        </TransformGroup>

        <TransformGroup label={t("inspector.scale", "Scale")}>
          <Vector3Input
            value={scale}
            onChange={(axis, v) => {
              const next = { ...scale, [axis]: v };
              setScale(next);
              transform.setScale(next.x, next.y, next.z);
            }}
            step={0.01}
          />
        </TransformGroup>
      </div>
    </div>
  );
}
