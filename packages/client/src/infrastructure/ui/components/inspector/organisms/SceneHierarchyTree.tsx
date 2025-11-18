import { useEffect, useMemo, useState } from "preact/hooks";
import type Entity from "@client/domain/ecs/core/Entity";
import { ReferenceField } from "../molecules/ReferenceField";
import { useServices } from '../../../hooks/useServices';
import { useI18n } from '../../../hooks/useI18n';
import { TreeView, TreeNodeData } from '../../common/molecules/TreeView';
import { CreateEntityButton } from '../molecules/CreateEntityButton';
import { CameraIcon, LightIcon, GeometryIcon, EntityIcon } from '../../common/icons';

type Props = {
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onError?: (msg: string) => void;
};

// Helper: convert Entity graph into TreeNodeData
function getIconForEntity(ent: Entity) {
  try {
    if (ent.hasComponent && ent.hasComponent('cameraView')) return <CameraIcon />;
    if (ent.hasComponent && ent.hasComponent('light')) return <LightIcon />;
    // geometry components have type names containing 'geometry'
    const comps = typeof ent.getAllComponents === 'function' ? ent.getAllComponents() : [];
    if (comps.some((c: any) => c && c.type && String(c.type).toLowerCase().includes('geometry'))) return <GeometryIcon />;
    // fallback
    return <EntityIcon />;
  } catch {
    return <EntityIcon />;
  }
}

function buildNode(ent: Entity): TreeNodeData {
  return {
    id: ent.id,
    label: ent.id,
    icon: getIconForEntity(ent),
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
        <div style={{ marginLeft: 'auto' }}>
          <CreateEntityButton onCreated={() => { /* no-op: scene updates should arrive via subscription */ }} />
        </div>
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
      {/* Removed ReferenceField dropdown — reparent now via drag & drop */}
    </div>
  );
}
