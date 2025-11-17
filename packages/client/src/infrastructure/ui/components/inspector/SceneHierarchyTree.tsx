import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import type Entity from "@client/domain/ecs/core/Entity";
import ReferenceField from "./ReferenceField";
import { useServices } from "../../hooks/useServices";
import { useI18n } from "../../hooks/useI18n";

type Props = {
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onError?: (msg: string) => void;
};

function renderNode(
  ent: Entity,
  selectedId: string | null,
  onSelect: (id: string) => void,
  children: Entity[]
) {
  return (
    <div key={ent.id}>
      <div
        class={`entity-item ${selectedId === ent.id ? "selected" : ""}`}
        onClick={() => onSelect(ent.id)}
      >
        {ent.id}
      </div>
      {children.length > 0 && (
        <div class="entity-children">
          {children.map((c) =>
            renderNode(c, selectedId, onSelect, c.getChildren())
          )}
        </div>
      )}
    </div>
  );
}

export default function SceneHierarchyTree({
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
    const unsub = services.sceneManager?.subscribeToSceneChanges((ev) => {
      // refresh on any hierarchy/entity change
      if (
        ["entity-added", "entity-removed", "hierarchy-changed"].includes(
          ev.kind
        )
      ) {
        const arr = services.sceneManager?.getEntities
          ? Array.from(services.sceneManager.getEntities())
          : [];
        setEntities(arr);
      }
      if (ev.kind === "error" && onError) onError(ev.message || "");
    });
    return () => {
      try {
        unsub && unsub();
      } catch {}
    };
  }, [services.sceneManager]);

  const roots = useMemo(() => entities.filter((e) => !e.parent), [entities]);

  const handleReparent = (childId: string, newParentId: string | null) => {
    const mgr = services.sceneManager;
    if (!mgr) return;
    // Prefer the Result-returning API when available
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

    // Fallback to older void-returning API
    try {
      (mgr as any).reparentEntity &&
        (mgr as any).reparentEntity(childId, newParentId);
    } catch (e: any) {
      if (onError) onError(String(e));
    }
  };

  return (
    <div>
      <div class="inspector-toolbar">
        <div class="small-label">{t("inspector.hierarchy", "Hierarchy")}</div>
      </div>

      <div>
        {roots.map((r) =>
          renderNode(
            r,
            selectedId || null,
            (id) => onSelect && onSelect(id),
            r.getChildren()
          )
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <div class="small-label">{t("inspector.reparent", "Reparent")}</div>
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
        <div class="small-label">
          {t(
            "inspector.reparentNote",
            "Select a parent from the dropdown to reparent the selected entity"
          )}
        </div>
      </div>
    </div>
  );
}
