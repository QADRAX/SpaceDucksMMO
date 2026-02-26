import type { Entity, IEcsComponentFactory } from "../../ecs";
import type { SceneEventBus } from "../SceneEventBus";
import type { AssetResolver } from "./AssetResolver";
import type { IPrefabRegistry } from "../../ports/IPrefabRegistry";
import type { IGizmoRenderer } from "../../ports/IGizmoRenderer";

export interface BridgeContext {
    getEntity: (id: string) => Entity | undefined;
    getAllEntities: () => Entity[];
    getEventBus: () => SceneEventBus;
    componentFactory: IEcsComponentFactory;
    assetResolver?: AssetResolver;

    // Cross-script property access (Phase 12)
    /** Returns an array of { scriptId, slotId } for all script slots on the entity. */
    getScriptSlots?: (entityId: string) => { scriptId: string; slotId: string }[];
    /** Reads a single property from a script slot identified by scriptId on the given entity. */
    getSlotProperty?: (entityId: string, scriptId: string, key: string) => any;
    /** Writes a single property to a script slot identified by scriptId on the given entity. */
    setSlotProperty?: (entityId: string, scriptId: string, key: string, value: any) => void;

    // Prefab support (Phase 13)
    prefabRegistry?: IPrefabRegistry;

    // Gizmo rendering (Phase 18)
    gizmoRenderer?: IGizmoRenderer;
}



