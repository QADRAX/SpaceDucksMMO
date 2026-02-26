import type { Entity, IEcsComponentFactory } from "@duckengine/ecs";
import type { SceneEventBus } from "../SceneEventBus";
import type { AssetResolver } from "./AssetResolver";
import type { IPrefabRegistry } from "../../ports/IPrefabRegistry";

export interface BridgeContext {
    mode: 'game' | 'editor';
    getEntity: (id: string) => Entity | undefined;
    getAllEntities: () => Entity[];
    getEventBus: () => SceneEventBus;
    componentFactory: IEcsComponentFactory;
    assetResolver?: AssetResolver;

    // Cross-script property access (Phase 12)
    /** Returns an array of { scriptId, slotId } for all script slots on the entity. */
    getScriptSlots?: (entityId: string) => { scriptId: string; slotId: string }[];
    /** Reads a single property from a script slot identified by scriptId on the given entity. */
    getSlotProperty?: (entityId: string, scriptId: string, key: string) => unknown;
    /** Writes a single property to a script slot identified by scriptId on the given entity. */
    setSlotProperty?: (entityId: string, scriptId: string, key: string, value: unknown) => void;

    // Prefab support (Phase 13)
    prefabRegistry?: IPrefabRegistry;
}


