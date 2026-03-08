/** @jest-environment node */
jest.unmock('wasmoon');

import { createWasmoonSandbox } from './wasmoonSandbox';
import type { ScriptSandbox } from '../../domain/ports';

/** Minimal bridge context stub for tests. */
const stubBridges = {
    Transform: {
        getPosition: () => ({ x: 0, y: 0, z: 0 }),
    },
};

/** Script that returns a hooks table (preferred style). */
const RETURN_TABLE_SCRIPT = `
return {
  init = function(self)
    self.state.initialized = true
  end,
  update = function(self, dt)
    self.state.elapsed = (self.state.elapsed or 0) + dt
  end,
}
`;

/** Script that writes to self.properties (dirty tracking test). */
const DIRTY_PROPS_SCRIPT = `
return {
  init = function(self)
    self.properties.counter = 42
  end,
}
`;

/** Script with top-level function style. */
const TOP_LEVEL_FN_SCRIPT = `
function init(self)
  self.state.ran = true
end
`;

/** Script that deliberately errors. */
const ERROR_SCRIPT = `
return {
  update = function(self, dt)
    error("intentional error")
  end,
}
`;

describe('createWasmoonSandbox', () => {
    let sandbox: ScriptSandbox;

    beforeAll(async () => {
        sandbox = await createWasmoonSandbox();
    });

    afterAll(() => {
        sandbox.dispose();
    });

    // ---
    // detectHooks
    // ---

    describe('detectHooks', () => {
        it('detects hooks in return-table style', () => {
            const hooks = sandbox.detectHooks(RETURN_TABLE_SCRIPT);
            expect(hooks).toContain('init');
            expect(hooks).toContain('update');
        });

        it('detects hooks in top-level function style', () => {
            const hooks = sandbox.detectHooks(TOP_LEVEL_FN_SCRIPT);
            expect(hooks).toContain('init');
        });

        it('returns empty array for scripts with no hooks', () => {
            const hooks = sandbox.detectHooks('local x = 1 + 1');
            expect(hooks).toHaveLength(0);
        });
    });

    // ---
    // createSlot + callHook (init)
    // ---

    describe('createSlot and callHook', () => {
        it('creates a slot and runs init hook without error', () => {
            sandbox.createSlot('e1::s1', RETURN_TABLE_SCRIPT, stubBridges, {});
            const ok = sandbox.callHook('e1::s1', 'init', 0);
            expect(ok).toBe(true);
        });

        it('runs update hook with dt', () => {
            sandbox.createSlot('e1::s2', RETURN_TABLE_SCRIPT, stubBridges, {});
            sandbox.callHook('e1::s2', 'init', 0);
            const ok = sandbox.callHook('e1::s2', 'update', 0.016);
            expect(ok).toBe(true);
        });

        it('returns true when calling an undeclared hook', () => {
            sandbox.createSlot('e1::s3', RETURN_TABLE_SCRIPT, stubBridges, {});
            // onEnable is not declared in RETURN_TABLE_SCRIPT
            const ok = sandbox.callHook('e1::s3', 'onEnable', 0);
            expect(ok).toBe(true);
        });

        it('returns false when script hook throws', () => {
            sandbox.createSlot('e1::s4', ERROR_SCRIPT, stubBridges, {});
            const ok = sandbox.callHook('e1::s4', 'update', 0.016);
            expect(ok).toBe(false);
        });

        it('loads top-level function style scripts', () => {
            sandbox.createSlot('e1::s5', TOP_LEVEL_FN_SCRIPT, stubBridges, {});
            const ok = sandbox.callHook('e1::s5', 'init', 0);
            expect(ok).toBe(true);
        });
    });

    // ---
    // syncProperties
    // ---

    describe('syncProperties', () => {
        it('pushes properties into a slot without error', () => {
            sandbox.createSlot('e2::s1', RETURN_TABLE_SCRIPT, stubBridges, { speed: 5 });
            expect(() => {
                sandbox.syncProperties('e2::s1', { speed: 10, active: true });
            }).not.toThrow();
        });
    });

    // ---
    // flushDirtyProperties
    // ---

    describe('flushDirtyProperties', () => {
        it('returns null when no properties are dirty', () => {
            sandbox.createSlot('e3::s1', RETURN_TABLE_SCRIPT, stubBridges, {});
            const dirty = sandbox.flushDirtyProperties('e3::s1');
            expect(dirty).toBeNull();
        });

        it('returns dirty keys after script mutates self.properties', () => {
            sandbox.createSlot('e3::s2', DIRTY_PROPS_SCRIPT, stubBridges, { counter: 0 });
            sandbox.callHook('e3::s2', 'init', 0);
            const dirty = sandbox.flushDirtyProperties('e3::s2');
            expect(dirty).not.toBeNull();
            expect(dirty?.has('counter')).toBe(true);
        });

        it('clears dirty keys after flush (second flush returns null)', () => {
            sandbox.createSlot('e3::s3', DIRTY_PROPS_SCRIPT, stubBridges, { counter: 0 });
            sandbox.callHook('e3::s3', 'init', 0);
            sandbox.flushDirtyProperties('e3::s3'); // consume
            const second = sandbox.flushDirtyProperties('e3::s3');
            expect(second).toBeNull();
        });
    });

    // ---
    // destroySlot
    // ---

    describe('destroySlot', () => {
        it('destroys a slot without throwing', () => {
            sandbox.createSlot('e4::s1', RETURN_TABLE_SCRIPT, stubBridges, {});
            expect(() => sandbox.destroySlot('e4::s1')).not.toThrow();
        });

        it('callHook returns true (no-op) after slot is destroyed', () => {
            sandbox.createSlot('e4::s2', RETURN_TABLE_SCRIPT, stubBridges, {});
            sandbox.destroySlot('e4::s2');
            const ok = sandbox.callHook('e4::s2', 'init', 0);
            expect(ok).toBe(true);
        });

        it('destroying a non-existent slot does not throw', () => {
            expect(() => sandbox.destroySlot('ghost::slot')).not.toThrow();
        });
    });
});
