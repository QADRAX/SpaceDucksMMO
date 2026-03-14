import {
    createEngine,
    createDuckEngineAPI,
    ResourceLoaderPortDef,
    DiagnosticPortDef,
    definePort,
    ok,
    createSceneSubsystem,
} from '@duckengine/core-v2';
import type {
    InputPort,
    GizmoPort,
    PhysicsQueryPort,
    ResourceLoaderPort,
    DiagnosticPort,
    PortBinding,
} from '@duckengine/core-v2';
import { createScriptingSubsystem } from '../scriptingSubsystem';

// Standard port definitions used across the engine
const InputPortDef = definePort<InputPort>('io:input')
    .addMethod('isKeyPressed')
    .addMethod('getMouseDelta')
    .addMethod('getMouseButtons')
    .build();

const GizmoPortDef = definePort<GizmoPort>('io:gizmo')
    .addMethod('drawLine')
    .addMethod('drawSphere')
    .addMethod('drawBox')
    .addMethod('drawLabel')
    .addMethod('drawGrid')
    .addMethod('clear')
    .build();

const PhysicsQueryPortDef = definePort<PhysicsQueryPort>('io:physics-query')
    .addMethod('raycast')
    .addMethod('getCollisionEvents')
    .build();

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

/**
 * Creates a mock ResourceLoaderPort that allows registering test scripts.
 */
export function createMockResourceLoader() {
    const scripts = new Map<string, { source: string; key: string }>();

    const loader: ResourceLoaderPort = {
        resolve: jest.fn(async (ref) => {
            const script = Array.from(scripts.values()).find(s => s.key === ref.key);
            if (script) {
                return ok({
                    key: script.key as any,
                    resourceId: `res-${script.key}`,
                    version: 1,
                    componentType: 'script' as any,
                    componentData: {},
                    files: { source: { url: `http://test-cdn/${script.key}.lua` } }
                } as any);
            }
            return { ok: false, error: { kind: 'not-found', message: `Script ${ref.key} not found` } } as any;
        }),
        fetchFile: jest.fn(async (url) => {
            const script = Array.from(scripts.values()).find(s => `http://test-cdn/${s.key}.lua` === url);
            if (script) {
                return ok(script.source as any);
            }
            return { ok: false, error: { kind: 'not-found', message: `File at ${url} not found` } } as any;
        })
    };

    return {
        loader,
        registerScript: (key: string, source: string) => {
            scripts.set(key, { key, source });
        }
    };
}

/**
 * Helper to bootstrap a full engine integration test for scripting.
 *
 * When omitPhysicsFromCustomPorts is true, do not bind a global PhysicsQueryPort;
 * use a scene-scoped mock instead (e.g. pass createMockPhysicsPerSceneSubsystem()
 * first in sceneSubsystems) so each scene gets its own physics port.
 */
export async function setupScriptingIntegrationTest(params?: {
    customPorts?: PortBinding<any>[];
    /** If true, physics port comes only from scene subsystems (per-scene mock). */
    omitPhysicsFromCustomPorts?: boolean;
    /** If set, use these scene subsystems; else [scriptingSubsystem]. */
    sceneSubsystems?: Awaited<ReturnType<typeof createScriptingSubsystem>>[];
}) {
    const engine = createEngine();
    const api = createDuckEngineAPI(engine);

    const { mockInput, mockGizmo, mockPhysics, mockDiagnostic } = createMockPorts();
    const { loader, registerScript } = createMockResourceLoader();

    const scriptingSubsystem = await createScriptingSubsystem();

    const customPorts: PortBinding<any>[] = [
        InputPortDef.bind(mockInput),
        GizmoPortDef.bind(mockGizmo),
        ...(params?.omitPhysicsFromCustomPorts ? [] : [PhysicsQueryPortDef.bind(mockPhysics)]),
        DiagnosticPortDef.bind(mockDiagnostic),
        ResourceLoaderPortDef.bind(loader),
        ...(params?.customPorts ?? []),
    ];

    api.setup({
        customPorts,
        sceneSubsystems: params?.sceneSubsystems ?? [scriptingSubsystem],
    });

    return {
        api,
        engine,
        mocks: {
            input: mockInput,
            gizmo: mockGizmo,
            physics: mockPhysics,
            diagnostic: mockDiagnostic,
            resourceLoader: loader
        },
        registerScript
    };
}
