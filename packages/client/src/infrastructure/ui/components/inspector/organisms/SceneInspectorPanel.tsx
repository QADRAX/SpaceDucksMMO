import { useEffect, useState } from "preact/hooks";
import { SceneHierarchyTree } from "./SceneHierarchyTree";
import { ComponentInspector } from "./ComponentInspector";
import { TransformEditor } from "./TransformEditor";
import { CameraSelector } from "../molecules/CameraSelector";
import { SceneIcon } from '../../common/icons';
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
  // Remember panel position so we can restore it
  const [inspectorPanelPosition, setInspectorPanelPosition] = useState<{ x: number; y: number }>(() => ({ x: 20, y: 80 }));
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
      defaultPosition={inspectorPanelPosition}
      onPositionChange={(p) => setInspectorPanelPosition(p)}
      /* sensible max size so inspector doesn't cover whole screen */
      maxWidth={520}
      maxHeight={800}
    >
      <div className="scene-inspector">
          <div className="inspector-header">
            <div className="inspector-header__row">
              <div className="small-label inspector-scene">
                <SceneIcon className="inspector-scene-icon" />
                {t("inspector.scene", "Scene")}: <span className="inspector-scene-id">{sceneManager?.getCurrent()?.id}</span>
              </div>
            </div>
            <div className="inspector-header__row">
              <div className="small-label inspector-active-camera">
                {t("inspector.activeCamera", "Active Camera")}:
                <div style={{ marginLeft: 8, display: 'inline-block' }}>
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
                </div>
              </div>
            </div>
          </div>

          <div className="inspector-divider" />
          {!inspectable && (
            <div className="error-box">
              {t("inspector.notInspectable", "Scene not inspectable")}
            </div>
          )}
          {lastError && <div className="error-box">{lastError}</div>}

          <SceneHierarchyTree
            selectedId={selected}
            onSelect={(id) => setSelected(id)}
            onError={(m) => setLastError(m)}
          />

          {selectedEntity && (
            <DraggablePanel
              title={`${t('inspector.components','Components')} - ${selectedEntity.id}`}
              theme="blue"
              defaultPosition={{ x: 360, y: 120 }}
              defaultSize={{ width: 360, height: 420 }}
              showClose={true}
              onClose={() => setSelected(null)}
            >
              <TransformEditor entity={selectedEntity} />
              <ComponentInspector entity={selectedEntity} />
            </DraggablePanel>
          )}
      </div>
    </DraggablePanel>
  );
}
