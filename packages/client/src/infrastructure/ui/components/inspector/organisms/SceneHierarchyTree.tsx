import { useEffect, useState } from "preact/hooks";
import type Entity from "@client/domain/ecs/core/Entity";
import { useServices } from "../../../hooks/useServices";
import { useI18n } from "../../../hooks/useI18n";
import { CreateEntityButton } from "../molecules/CreateEntityButton";
import {
  CameraIcon,
  LightIcon,
  GeometryIcon,
  EntityIcon,
} from "../../common/icons";
import { TreeView } from "../../common";

type Props = {
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onError?: (msg: string) => void;
};

// Helper: convert Entity graph into TreeNodeData
function getIconForEntity(ent: Entity) {
  try {
    if (ent.hasComponent && ent.hasComponent("cameraView"))
      return <CameraIcon />;
    if (ent.hasComponent && ent.hasComponent("light")) return <LightIcon />;
    // geometry components have type names containing 'geometry'
    const comps =
      typeof ent.getAllComponents === "function" ? ent.getAllComponents() : [];
    if (
      comps.some(
        (c: any) =>
          c && c.type && String(c.type).toLowerCase().includes("geometry")
      )
    )
      return <GeometryIcon />;
    // fallback
    return <EntityIcon />;
  } catch {
    return <EntityIcon />;
  }
}

export function SceneHierarchyTree({ selectedId, onSelect, onError }: Props) {
  const services = useServices();
  const { t } = useI18n();

  const [entities, setEntities] = useState<Entity[]>(() =>
    Array.from(services.sceneManager?.getEntities() || [])
  );

  useEffect(() => {
    const update = () => {
      const arr = services.sceneManager?.getEntities
        ? Array.from(services.sceneManager.getEntities())
        : [];
      setEntities(arr);
    };

    try {
      update();
    } catch {}

    const unsub = services.sceneManager?.subscribeToSceneChanges((ev) => {
      if (
        ["entity-added", "entity-removed", "hierarchy-changed"].includes(
          ev.kind
        )
      ) {
        update();
      }
      if (ev.kind === "error" && onError) onError(ev.message || "");
    });
    return () => {
      try {
        unsub && unsub();
      } catch {}
    };
  }, [services.sceneManager]);

  const handleReparent = (childId: string, newParentId: string | null) => {
    const mgr = services.sceneManager;
    if (!mgr) return;
    if (typeof mgr.reparentEntityResult === "function") {
      try {
        const res = mgr.reparentEntityResult(childId, newParentId);
        if (res && !res.ok && onError)
          onError(res.error?.message || "reparent failed");
      } catch (e: any) {
        if (onError) onError(String(e));
      }
      return;
    }
  };

  // Convert entities to TreeView nodes
  const nodes = entities.map((ent) => ({
    id: ent.id,
    parentId: ent.parent?.id || null,
    label: ent.id,
    icon: getIconForEntity(ent),
    data: ent,
  }));

  return (
    <div>
      <div className="inspector-toolbar">
        <div className="small-label">
          {t("inspector.hierarchy", "Hierarchy")}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <CreateEntityButton
            onCreated={() => {
              /* no-op: scene updates should arrive via subscription */
            }}
          />
        </div>
      </div>

      <TreeView
        nodes={nodes}
        selectedId={selectedId}
        onSelect={(id) => onSelect && onSelect(id)}
        onReparent={({ draggedId, newParentId }) =>
          handleReparent(draggedId, newParentId ?? null)
        }
      />

    </div>
  );
}
