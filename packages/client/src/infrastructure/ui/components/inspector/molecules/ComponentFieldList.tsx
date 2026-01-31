import type { Component } from "@duckengine/rendering-three/ecs";
import { ComponentFieldRow } from "./ComponentFieldRow";
import type { InspectorFieldConfig } from "@duckengine/rendering-three/ecs";

type Props = {
  component: Component;
};

export function ComponentFieldList({ component }: Props) {
  const meta = component.metadata;
  let fields: { key: string; cfg?: InspectorFieldConfig }[] = [];
  if (meta?.inspector && Array.isArray(meta.inspector.fields)) {
    fields = meta.inspector.fields.map((f: any) => ({ key: f.key, cfg: f }));
  } else {
    fields = Object.keys(component)
      .filter((k) => k !== "metadata" && k !== "type" && !k.startsWith("_"))
      .filter((k) => typeof (component as any)[k] !== "function")
      .filter((k) => !["scene", "renderer", "renderSyncSystem"].includes(k))
      .map((k) => ({ key: k }));
  }

  return (
    <div style={{ paddingTop: 6 }}>
      {fields.map((f) => (
        <ComponentFieldRow
          key={f.key}
          component={component}
          fieldKey={f.key}
          fieldConfig={f.cfg}
        />
      ))}
    </div>
  );
}
