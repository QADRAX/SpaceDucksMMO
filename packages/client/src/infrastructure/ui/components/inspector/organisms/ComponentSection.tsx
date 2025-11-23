import Component from "@client/domain/ecs/core/Component";
import { ComponentFieldList } from "../molecules/ComponentFieldList";
import type Entity from "@client/domain/ecs/core/Entity";
import { PropertyCheckbox } from "../../common/atoms/PropertyCheckbox";
import { Button } from "../../common/atoms/Button";

type Props = {
  component: Component;
  entity: Entity;
  onChanged: () => void;
  t: (k: string, f?: string) => string;
};

export function ComponentSection({
  component,
  entity,
  onChanged,
  t,
}: Props) {
  const handleRemove = () => {
    const res = entity.safeRemoveComponent(component.type);
    if (!res.ok) alert(res.error.message);
    else onChanged();
  };
  const handleToggle = () => {
    try {
      component.enabled = !component.enabled;
    } catch {}
    onChanged();
  };

  return (
    <div className="component-section" key={component.type}>
      <div className="component-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div>{component.type}</div>
        </div>
        <div className="component-controls">
          <PropertyCheckbox
            checked={component.enabled}
            onChange={() => handleToggle()}
            label={t("inspector.enabled", "Enabled")}
          />
          <Button variant="ghost" size="small" onClick={() => handleRemove()}>
            {t("inspector.remove", "Remove")}
          </Button>
        </div>
      </div>
      <ComponentFieldList component={component}/>
    </div>
  );
}
