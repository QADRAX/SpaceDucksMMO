import type { SceneState, EntityId } from '@duckengine/core-v2';
import { emitSceneChange } from '@duckengine/core-v2';
import type { BridgeDeclaration } from './types';

/** Script slot shape (core-v2 ScriptReference). */
interface ScriptSlot {
  scriptId: string;
  enabled: boolean;
  properties: Record<string, unknown>;
}

/** 
 * Scripts bridge — allows interacting with other scripts on the same entity.
 * Uses field paths (e.g. scripts[0].properties.x) for updates.
 */
export const scriptsBridge: BridgeDeclaration = {
    name: 'Script',
    perEntity: true,
    factory(scene: SceneState, _scopedEntityId: string, _schema: unknown) {
        const getScriptComponent = (entityId: string) => {
            const e = scene.entities.get(entityId as EntityId);
            if (!e) throw new Error(`Entity '${entityId}' not in scene.`);
            const scriptComp = e.components.get('script') as { scripts: ScriptSlot[] } | undefined;
            return scriptComp;
        };

        return {
            /** Sets a property on a sibling script by its ID. */
            setProperty(id: string, scriptId: string, key: string, value: unknown) {
                const comp = getScriptComponent(id);
                if (!comp) return;

                const index = comp.scripts.findIndex((s: ScriptSlot) => s.scriptId === scriptId);
                if (index === -1) return;

                comp.scripts[index].properties[key] = value;

                emitSceneChange(scene, {
                    kind: 'component-changed',
                    entityId: id as EntityId,
                    componentType: 'script',
                });
            },

            /** Gets a property from a sibling script by its ID. */
            getProperty(id: string, scriptId: string, key: string) {
                const comp = getScriptComponent(id);
                if (!comp) return undefined;

                const script = comp.scripts.find((s: ScriptSlot) => s.scriptId === scriptId);
                if (!script) return undefined;

                return script.properties[key];
            },

            /** Checks if a script exists on the entity. */
            hasScript(id: string, scriptId: string) {
                const comp = getScriptComponent(id);
                if (!comp) return false;
                return comp.scripts.some((s: ScriptSlot) => s.scriptId === scriptId);
            }
        };
    },
};
