import { useEffect, useMemo, useState } from "preact/hooks";
import type Entity from "@client/domain/ecs/core/Entity";
import { ReferenceField } from "../molecules/ReferenceField";
import { useServices } from '../../../hooks/useServices';
import { useI18n } from '../../../hooks/useI18n';
import { TreeView, TreeNodeData } from '../../common/molecules/TreeView';

type Props = {
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onError?: (msg: string) => void;
};

// Helper: convert Entity graph into TreeNodeData
function buildNode(ent: Entity): TreeNodeData {
  return {
    id: ent.id,
    label: ent.id,
    icon: '🔹',
    children: ent.getChildren().map((c: Entity) => buildNode(c)),
  };
}

export function SceneHierarchyTree({
  selectedId,
  onSelect,
  onError,
}: Props) {
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

    try { update(); } catch {}

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
    return () => { try { unsub && unsub(); } catch {} };
  }, [services.sceneManager]);

  const roots = useMemo(() => entities.filter((e) => !e.parent), [entities]);

  const treeNodes = useMemo<TreeNodeData[]>(() => roots.map((r) => buildNode(r)), [roots]);

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

    try {
      (mgr as any).reparentEntity &&
        (mgr as any).reparentEntity(childId, newParentId);
    } catch (e: any) {
      if (onError) onError(String(e));
    }
  };

  return (
    <div>
      <div className="inspector-toolbar">
        <div className="small-label">{t("inspector.hierarchy", "Hierarchy")}</div>
      </div>

      <div>
        <TreeView
          nodes={treeNodes}
          selectedId={selectedId ?? null}
          onSelect={(id) => onSelect && onSelect(id)}
          draggable={true}
          onDropNode={(childId, newParentId) => handleReparent(childId, newParentId)}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="small-label">{t("inspector.reparent", "Reparent")}</div>
          <div style={{ marginTop: 4 }}>
            {(() => {
              const selectedEntity = entities.find(e => e.id === selectedId);
              const currentParentId = selectedEntity?.parent?.id ?? null;
              return (
                <ReferenceField
                  value={currentParentId}
                  onChange={(newParent) => {
                    if (!selectedId) return;
                    handleReparent(selectedId, newParent);
                  }}
                  placeholder={t("inspector.noParent", "No parent")}
                />
              );
            })()}
          </div>
        <div className="small-label">
          {t(
            "inspector.reparentNote",
            "Select a parent from the dropdown to reparent the selected entity"
          )}
        </div>
      </div>
    </div>
  );
}
