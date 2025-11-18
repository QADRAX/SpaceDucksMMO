import { useEffect, useState } from "preact/hooks";
import { SceneHierarchyTree } from "./SceneHierarchyTree";
import { ComponentInspector } from "./ComponentInspector";
import { TransformEditor } from "./TransformEditor";
import { CameraSelector } from "../molecules/CameraSelector";
import { useServices } from '../../../hooks/useServices';
import { useI18n } from '../../../hooks/useI18n';
import { DraggablePanel } from '../../common/organisms/DraggablePanel';
import "./inspector.css";

export function SceneInspectorPanel() {
  const services = useServices();
  const { t } = useI18n();
  const sceneManager = services.sceneManager;

  const [entities, setEntities] = useState(sceneManager?.getEntities() || []);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<string | null>(
    sceneManager?.getActiveCameraEntityId() || null
  );
  const [inspectable, setInspectable] = useState<boolean>(() =>
    !!sceneManager?.checkInspectable
      ? sceneManager!.checkInspectable(sceneManager!.getCurrent()?.id || "")
          ?.ok ?? true
      : true
  );

  useEffect(() => {
    const unsub = sceneManager?.subscribeToSceneChanges((ev) => {
      if (
        [
          "entity-added",
          "entity-removed",
          "hierarchy-changed",
          "component-changed",
        ].includes(ev.kind)
      ) {
        setEntities(sceneManager.getEntities());
      }
      if (ev.kind === "error") setLastError(ev.message || null);
      if (ev.kind === "active-camera-changed")
        setActiveCamera((ev as any).entityId || null);
    });
    return () => {
      try {
        unsub && unsub();
      } catch {}
    };
  }, [sceneManager]);

  useEffect(() => {
    const curr = sceneManager?.getCurrent();
    if (!curr) return;
    const res = sceneManager?.checkInspectable(curr.id);
    setInspectable(res?.ok ?? true);
  }, [sceneManager]);

  const selectedEntity = entities.find((e: any) => e.id === selected);
  const cameraEntities = entities.filter((e: any) =>
    typeof e.hasComponent === "function" ? e.hasComponent("cameraView") : false
  );

  return (
    <DraggablePanel
      title={t("inspector.title", "Scene Inspector")}
      theme="gold"
    >
      <div className="scene-inspector">
        <div className="inspector-left">
          <div class="small-label">
            {t("inspector.scene", "Scene")}: {sceneManager?.getCurrent()?.id}
          </div>
          <div class="small-label">
            {t("inspector.activeCamera", "Active Camera")}: {" "}
            {activeCamera || t("inspector.none", "None")}
          </div>
          <CameraSelector
            entities={cameraEntities}
            activeCamera={activeCamera}
            onSetActive={(id: string) => {
              try {
                sceneManager?.setActiveCamera?.(id);
              } catch {}
              setActiveCamera(id);
            }}
          />
          {!inspectable && (
            <div className="error-box">
              {t("inspector.notInspectable", "Scene not inspectable")}
            </div>
          )}
          {lastError && <div class="error-box">{lastError}</div>}

          <SceneHierarchyTree
            selectedId={selected}
            onSelect={(id) => setSelected(id)}
            onError={(m) => setLastError(m)}
          />
        </div>

        <div className="inspector-right">
          <div className="small-label">
            {t("inspector.selected", "Selected")}:{" "}
            {selected || t("inspector.none", "None")}
          </div>
          <TransformEditor entity={selectedEntity} />
          <ComponentInspector entity={selectedEntity} />
        </div>
      </div>
    </DraggablePanel>
  );
}
