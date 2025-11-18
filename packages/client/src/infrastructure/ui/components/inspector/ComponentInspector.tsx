import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import type Entity from "@client/domain/ecs/core/Entity";
import type {
  ComponentMetadata,
  InspectorFieldConfig,
} from "@client/domain/ecs/core/ComponentMetadata";
import { useServices } from "../../hooks/useServices";
import { useI18n } from "../../hooks/useI18n";
import ReferenceField from "./ReferenceField";
import TextureSelector from "./TextureSelector";
import { PropertyCheckbox } from "../common/PropertyCheckbox";
import { PropertyInput } from "../common/PropertyInput";
import { PropertyNumber } from "../common/PropertyNumber";
import { PropertyReadonly } from "../common/PropertyReadonly";
import { Vector3Input } from "../common/Vector3Input";
import { KnownComponentType } from "@client/domain/ecs/core/ComponentFactory";

type Props = { entity?: Entity };

function renderValue(
  key: string,
  value: any,
  onChange: (v: any) => void,
  visited?: WeakSet<object>
) {
  if (!visited) visited = new WeakSet<object>();
  if (typeof value === "number") {
    return <PropertyNumber value={value as number} onChange={onChange} />;
  }
  if (typeof value === "boolean") {
    return <PropertyCheckbox checked={!!value} onChange={onChange} />;
  }
  if (typeof value === "string") {
    return <PropertyInput value={String(value)} onChange={onChange} />;
  }
  if (Array.isArray(value) && value.every((x) => typeof x === "number")) {
    // adapt to Vector3Input shape
    const obj = { x: value[0] || 0, y: value[1] || 0, z: value[2] || 0 };
    return (
      <Vector3Input
        value={obj}
        onChange={(axis, v) => {
          const next = [obj.x, obj.y, obj.z];
          if (axis === "x") next[0] = v;
          if (axis === "y") next[1] = v;
          if (axis === "z") next[2] = v;
          onChange(next);
        }}
      />
    );
  }
  if (typeof value === "object" && value !== null) {
    // Prevent infinite recursion on cyclic object graphs
    if (visited.has(value)) {
      return <PropertyReadonly value="[Circular]" />;
    }
    visited.add(value);
    return (
      <div style={{ paddingLeft: 8 }}>
        {Object.keys(value).map((k) => (
          <div class="prop-row">
            <div class="prop-key">{k}</div>
            <div class="prop-value">
              {renderValue(k, (value as any)[k], (nv: any) => {
                (value as any)[k] = nv;
                onChange(value);
              }, visited)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <PropertyReadonly value={value === undefined ? "-" : value} />;
}

function renderProperty(comp: any, key: string) {
  const value = (comp as any)[key];

  // Entity reference fields
  if (key === "targetEntityId") {
    return (
      <ReferenceField
        value={value || null}
        onChange={(id) => {
          (comp as any)[key] = id || "";
          try {
            comp.notifyChanged && comp.notifyChanged();
          } catch {}
        }}
      />
    );
  }

  // Texture fields on Material-like components
  if (["texture", "normalMap", "envMap"].includes(key)) {
    return (
      <TextureSelector
        value={value || null}
        onChange={(tx) => {
          (comp as any)[key] = tx || undefined;
          try {
            comp.notifyChanged && comp.notifyChanged();
          } catch {}
        }}
      />
    );
  }

  // Shader material uniforms: for texture-typed uniforms, use TextureSelector
  if (comp && comp.type === "shaderMaterial" && key === "uniforms") {
    const uniforms = value || {};
    return (
      <div style={{ paddingLeft: 8 }}>
        {Object.keys(uniforms).map((uname) => {
          const u = uniforms[uname];
          return (
            <div class="prop-row" key={uname}>
              <div class="prop-key">{uname}</div>
              <div class="prop-value">
                {u && u.type === "texture" ? (
                  <TextureSelector
                    value={u.value || null}
                    onChange={(tx) => {
                      u.value = tx || null;
                      try {
                        comp.notifyChanged && comp.notifyChanged();
                      } catch {}
                    }}
                  />
                ) : (
                  renderValue(uname, u?.value, (nv: any) => {
                    if (u) u.value = nv;
                    try {
                      comp.notifyChanged && comp.notifyChanged();
                    } catch {}
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Generic fallback
  return renderValue(key, value, (nv: any) => {
    (comp as any)[key] = nv;
    try {
      comp.notifyChanged && comp.notifyChanged();
    } catch {}
  });
}

function renderPropertyWithConfig(comp: any, key: string, cfg?: InspectorFieldConfig) {
  const value = cfg && cfg.get ? cfg.get(comp) : (comp as any)[key];

  const applyChange = (nv: any) => {
    if (cfg && cfg.set) {
      try {
        cfg.set(comp, nv);
      } catch {}
    } else {
      try {
        (comp as any)[key] = nv;
        comp.notifyChanged && comp.notifyChanged();
      } catch {}
    }
  };

  // Entity reference fields
  if (key === "targetEntityId") {
    return (
      <ReferenceField
        value={(value as any) || null}
        onChange={(id) => {
          applyChange(id || "");
        }}
      />
    );
  }

  // Texture fields on Material-like components
  if (["texture", "normalMap", "envMap"].includes(key)) {
    return (
      <TextureSelector
        value={(value as any) || null}
        onChange={(tx) => {
          applyChange(tx || undefined);
        }}
      />
    );
  }

  // Shader material uniforms: preserve original uniforms editor when present on the component
  if (comp && comp.type === "shaderMaterial" && key === "uniforms") {
    const uniforms = value || {};
    return (
      <div style={{ paddingLeft: 8 }}>
        {Object.keys(uniforms).map((uname) => {
          const u = uniforms[uname];
          return (
            <div class="prop-row" key={uname}>
              <div class="prop-key">{uname}</div>
              <div class="prop-value">
                {u && u.type === "texture" ? (
                  <TextureSelector
                    value={u.value || null}
                    onChange={(tx) => {
                      u.value = tx || null;
                      try {
                        comp.notifyChanged && comp.notifyChanged();
                      } catch {}
                    }}
                  />
                ) : (
                  renderValue(uname, u?.value, (nv: any) => {
                    if (u) u.value = nv;
                    try {
                      comp.notifyChanged && comp.notifyChanged();
                    } catch {}
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return renderValue(key, value, applyChange);
}

export default function ComponentInspector({ entity }: Props) {
  const services = useServices();
  const { t } = useI18n();
  const [added, setAdded] = useState(0);

  const components = useMemo(
    () => (entity ? entity.getAllComponents() : []),
    [entity, added]
  );

  useEffect(() => {
    // subscribe to component changes if entity emits them through scene change events
    const unsub = services.sceneManager?.subscribeToSceneChanges(() =>
      setAdded((c) => c + 1)
    );
    return () => {
      try {
        unsub && unsub();
      } catch {}
    };
  }, [services.sceneManager]);

  if (!entity)
    return (
      <div class="small-label">
        {t("inspector.noEntitySelected", "No entity selected")}
      </div>
    );

  const handleRemove = (type: string) => {
    const res = entity.safeRemoveComponent(type);
    if (!res.ok) {
      alert(res.error.message);
    } else {
      setAdded((c) => c + 1);
    }
  };

  const handleToggle = (comp: any) => {
    try {
      comp.enabled = !comp.enabled;
    } catch (e) {}
    setAdded((c) => c + 1);
  };
  const addComponent = (type: KnownComponentType) => {
    const factory = services.ecsComponentFactory;
    if (!factory) {
      alert(
        t("inspector.addComponentNoFactory", "No component factory available")
      );
      return;
    }
    try {
      const comp = factory.create(type);
      const res = entity.safeAddComponent(comp);
      if (!res.ok) alert(res.error.message);
      else setAdded((c) => c + 1);
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  };

  return (
    <div>
      <div class="small-label">{t("inspector.components", "Components")}</div>
      <div>
        {components.map((c: any) => (
          <div class="component-section" key={c.type}>
            <div class="component-header">
              <div>{c.type}</div>
              <div class="component-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={c.enabled}
                    onChange={() => handleToggle(c)}
                  />{" "}
                  {t("inspector.enabled", "Enabled")}
                </label>
                <button onClick={() => handleRemove(c.type)}>
                  {t("inspector.remove", "Remove")}
                </button>
              </div>
            </div>
            <div style={{ paddingTop: 6 }}>
              {(() => {
                const meta = (c as any).metadata as
                  | ComponentMetadata
                  | undefined;
                const inspector = meta?.inspector;
                type FieldEntry = { key: string; cfg?: InspectorFieldConfig };
                let fields: FieldEntry[] = [];
                if (inspector && Array.isArray(inspector.fields)) {
                  fields = inspector.fields.map((f) => ({ key: f.key, cfg: f }));
                } else {
                  fields = Object.keys(c)
                    .filter((k) => k !== "metadata" && k !== "type" && !k.startsWith("_"))
                    .filter((k) => typeof (c as any)[k] !== "function")
                    .filter((k) => !["scene", "renderer", "renderSyncSystem"].includes(k))
                    .map((k) => ({ key: k }));
                }

                return fields.map((f) => (
                  <div class="prop-row" key={f.key}>
                    <div class="prop-key">{f.cfg?.label ?? f.key}</div>
                    <div class="prop-value">
                      {renderPropertyWithConfig(c, f.key, f.cfg)}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <div class="small-label">
          {t("inspector.addComponent", "Add Component")}
        </div>
        <div style={{ marginTop: 4 }}>
          <select
            class="select-input"
            onChange={(e: any) => {
              const value = e.target.value as KnownComponentType | "";
              if (value) addComponent(value);
              e.target.value = "";
            }}
          >
            <option value="">
              {t("inspector.selectComponent", "Select...")}
            </option>
            {services.ecsComponentFactory && entity
              ? services
                  .ecsComponentFactory!.listCreatableComponents(entity)
                  .map((d) => (
                    <option key={d.type} value={d.type}>
                      {d.label}
                    </option>
                  ))
              : null}
          </select>
        </div>
      </div>
    </div>
  );
}
