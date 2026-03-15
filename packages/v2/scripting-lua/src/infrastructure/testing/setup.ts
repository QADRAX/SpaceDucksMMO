import {
    createEngine,
    createDuckEngineAPI,
    ResourceCachePortDef,
    DiagnosticPortDef,
    InputPortDef,
    GizmoPortDef,
    PhysicsQueryPortDef,
    createSceneSubsystem,
    createResourceKey,
    createResourceRef,
} from '@duckengine/core-v2';
import type {
    InputPort,
    GizmoPort,
    PhysicsQueryPort,
    ResourceCachePort,
    DiagnosticPort,
    PortBinding,
} from '@duckengine/core-v2';
import type { ResourceRef } from '@duckengine/core-v2';
import type { EngineSubsystem } from '@duckengine/core-v2';
import { createScriptingSubsystem } from '../scriptingSubsystem';

// Standard port definitions used across the engine
/**
 * Creates a scene subsystem that registers a scene-scoped mock PhysicsQueryPort.
 * Raycast returns a hit with entityId 'floor-' + scene.id so tests can assert
 * that scripts only see their own scene's physics (no cross-scene raycast).
 * Use with omitPhysicsFromCustomPorts so each scene uses this mock.
 */
export function createMockPhysicsPerSceneSubsystem() {
    return createSceneSubsystem({
        id: 'mock-physics-per-scene',
        createState(ctx) {
            const sceneId = ctx.scene.id;
            ctx.ports.register(PhysicsQueryPortDef, {
                raycast: () => ({
                    entityId: `floor-${sceneId}`,
                    point: { x: 0, y: 0, z: 0 },
                    normal: { x: 0, y: 1, z: 0 },
                    distance: 10,
                }),
                getCollisionEvents: () => [],
            });
            return {};
        },
    });
}

/**
 * Creates standard mock ports used in scripting tests.
 */
export function createMockPorts() {
    const mockInput: InputPort = {
        isKeyPressed: jest.fn(() => true),
        getMouseDelta: jest.fn(() => ({ x: 10, y: -5 })),
        getMouseButtons: jest.fn(() => ({ left: true, right: false, middle: false })),
    };

    const mockGizmo: GizmoPort = {
        drawLine: jest.fn(),
        drawSphere: jest.fn(),
        drawBox: jest.fn(),
        drawLabel: jest.fn(),
        drawGrid: jest.fn(),
        clear: jest.fn(),
    };

    const mockPhysics: PhysicsQueryPort = {
        raycast: jest.fn(() => ({
            entityId: 'hit-entity',
            point: { x: 0, y: -10, z: 0 },
            normal: { x: 0, y: 1, z: 0 },
            distance: 10,
        })),
        getCollisionEvents: jest.fn(() => []),
    };

    const mockDiagnostic: DiagnosticPort = {
        log: jest.fn(),
    };

    return { mockInput, mockGizmo, mockPhysics, mockDiagnostic };
}

function cacheKey(ref: ResourceRef<any>): string {
    return `${ref.key}@${ref.version ?? 'active'}`;
}

/**
 * Creates a minimal ResourceCachePort for tests: scripts only.
 * Mesh/texture/skybox are no-ops. Coordinator populates via store*.
 */
export function createScriptOnlyResourceCache(): ResourceCachePort {
    const scriptCache = new Map<string, string>();

    return {
        getMeshData: () => null,
        getTexture: () => null,
        getSkyboxTexture: () => null,
        getScriptSource: (ref) => scriptCache.get(cacheKey(ref)) ?? null,
        storeMeshData: () => {},
        storeTextureFromBlob: async () => {},
        storeSkyboxFromUrls: async () => {},
        storeScriptSource: (ref, source) => {
            scriptCache.set(cacheKey(ref), source);
        },
    };
}

/**
 * Creates a test cache with registerScript for tests that need resource scripts.
 * Pre-populate with registerScript before adding entities.
 */
export function createTestScriptCache(): {
    cache: ResourceCachePort;
    registerScript: (key: string, source: string) => void;
} {
    const cache = createScriptOnlyResourceCache();
    return {
        cache,
        registerScript: (key: string, source: string) => {
            const ref = createResourceRef(createResourceKey(key), 'script');
            cache.storeScriptSource?.(ref, source);
        },
    };
}

/**
 * Helper to bootstrap a full engine integration test for scripting.
 *
 * When omitPhysicsFromCustomPorts is true, do not bind a global PhysicsQueryPort;
 * use a scene-scoped mock instead (e.g. pass createMockPhysicsPerSceneSubsystem()
 * first in sceneSubsystems) so each scene gets its own physics port.
 *
 * Pass engineSubsystems when you need ResourceCachePort (e.g. ResourceCoordinator).
 * Subsystems should not depend on each other; composition belongs in a facade package.
 */
export async function setupScriptingIntegrationTest(params?: {
    customPorts?: PortBinding<any>[];
    /** If true, physics port comes only from scene subsystems (per-scene mock). */
    omitPhysicsFromCustomPorts?: boolean;
    /** If set, use these scene subsystems; else [scriptingSubsystem]. */
    sceneSubsystems?: Awaited<ReturnType<typeof createScriptingSubsystem>>[];
    /** Engine subsystems. Pass from facade when needed. */
    engineSubsystems?: EngineSubsystem[];
    /** ResourceCachePort. Default: createScriptOnlyResourceCache. Pre-populate with registerScript for resource scripts. */
    resourceCache?: ResourceCachePort;
}) {
    const engine = createEngine();
    const api = createDuckEngineAPI(engine);

    const { mockInput, mockGizmo, mockPhysics, mockDiagnostic } = createMockPorts();
    const { cache, registerScript } = createTestScriptCache();

    const scriptingSubsystem = await createScriptingSubsystem();

    const customPorts: PortBinding<unknown>[] = [
        InputPortDef.bind(mockInput),
        GizmoPortDef.bind(mockGizmo),
        ...(params?.omitPhysicsFromCustomPorts ? [] : [PhysicsQueryPortDef.bind(mockPhysics)]),
        DiagnosticPortDef.bind(mockDiagnostic),
        ResourceCachePortDef.bind(params?.resourceCache ?? cache),
        ...(params?.customPorts ?? []),
    ];

    const sceneSubsystems = params?.sceneSubsystems ?? [scriptingSubsystem];
    const engineSubsystems = params?.engineSubsystems ?? [];

    api.setup({
        customPorts,
        sceneSubsystems,
        engineSubsystems,
    });

    return {
        api,
        engine,
        mocks: {
            input: mockInput,
            gizmo: mockGizmo,
            physics: mockPhysics,
            diagnostic: mockDiagnostic,
        },
        registerScript,
    };
}
