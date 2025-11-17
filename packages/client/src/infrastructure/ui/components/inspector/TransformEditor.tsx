import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import type Entity from "@client/domain/ecs/core/Entity";
import { useI18n } from "../../hooks/useI18n";
import { TransformGroup } from "../common/TransformGroup";
import { Vector3Input } from "../common/Vector3Input";

type Props = { entity?: Entity };

export default function TransformEditor({ entity }: Props) {
  const { t } = useI18n();
  const transform = entity?.transform;

  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });

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

  if (!entity || !transform)
    return (
      <div class="small-label">
        {t("inspector.noEntitySelected", "No entity selected")}
      </div>
    );

  return (
    <div class="component-section">
      <div class="component-header">
        <strong>{t("inspector.transform", "Transform")}</strong>
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
