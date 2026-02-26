import type { Entity, IEcsComponentFactory } from "@duckengine/ecs";
import type { SceneEventBus } from "../SceneEventBus";
import type { AssetResolver } from "./AssetResolver";

export interface BridgeContext {
    getEntity: (id: string) => Entity | undefined;
    getAllEntities: () => Entity[];
    getEventBus: () => SceneEventBus;
    componentFactory: IEcsComponentFactory;
    assetResolver?: AssetResolver;
}
