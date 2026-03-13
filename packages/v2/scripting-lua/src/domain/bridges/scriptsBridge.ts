import type { EntityId, SceneState, ScriptReference } from '@duckengine/core-v2';
import { emitSceneChange } from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts, BridgeSession } from './types';
import { toEntityId } from './types';
import type { ScriptingSessionState } from '../session';
import { syncSiblingPropertyToSlot } from '../slots';
import { normalizeVec3Like } from '../properties';

/** 
 * Scripts bridge — allows interacting with other scripts on the same entity.
 * Uses field paths (e.g. scripts[0].properties.x) for updates.
 * When setProperty is called, also syncs to the sibling slot's Lua state so
 * the sibling sees the change in the same frame (e.g. WaypointPath driving MoveToPoint).
 */
export const scriptsBridge: BridgeDeclaration = {
    name: 'Script',
    perEntity: true,
    factory(scene: SceneState, _scopedEntityId, _schema: unknown, _ports: BridgePorts, session?: BridgeSession) {
        const sessionState = session as ScriptingSessionState | undefined;
        const getScriptComponent = (eid: EntityId) => {
            const e = scene.entities.get(eid);
            if (!e) throw new Error(`Entity '${eid}' not in scene.`);
            const scriptComp = e.components.get('script') as { scripts: ScriptReference[] } | undefined;
            return scriptComp;
        };

        return {
            /** Sets a property on a sibling script by its ID. id from Lua. */
            setProperty(id: string, scriptId: string, key: string, value: unknown) {
                const eid = toEntityId(id);
                const comp = getScriptComponent(eid);
                if (!comp) return;

                const index = comp.scripts.findIndex((s: ScriptReference) => s.scriptId === scriptId);
                if (index === -1) return;

                const normalized = normalizeVec3Like(value);
                comp.scripts[index].properties[key] = normalized;

                if (sessionState?.slots && sessionState?.sandbox) {
                    syncSiblingPropertyToSlot(
                        sessionState.slots,
                        sessionState.sandbox,
                        eid,
                        scriptId,
                        key,
                        normalized,
                    );
                }

                emitSceneChange(scene, {
                    kind: 'component-changed',
                    entityId: eid,
                    componentType: 'script',
                });
            },

            /** Gets a property from a sibling script by its ID. id from Lua. */
            getProperty(id: string, scriptId: string, key: string) {
                const comp = getScriptComponent(toEntityId(id));
                if (!comp) return undefined;

                const script = comp.scripts.find((s: ScriptReference) => s.scriptId === scriptId);
                if (!script) return undefined;

                return script.properties[key];
            },

            /** Checks if a script exists on the entity. id from Lua. */
            hasScript(id: string, scriptId: string) {
                const comp = getScriptComponent(toEntityId(id));
                if (!comp) return false;
                return comp.scripts.some((s: ScriptReference) => s.scriptId === scriptId);
            }
        };
    },
};
