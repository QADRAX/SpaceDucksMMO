import type { Entity } from "@duckengine/ecs";
import type { SceneEventBus } from "../SceneEventBus";

export interface BridgeContext {
    getEntity: (id: string) => Entity | undefined;
    getAllEntities: () => Entity[];
    getEventBus: () => SceneEventBus;
}
