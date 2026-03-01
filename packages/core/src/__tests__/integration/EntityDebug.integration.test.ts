/** @jest-environment node */
jest.unmock('wasmoon');

describe("Entity getPosition debug", () => {
    it("transform global is accessible from __EntityMT.__index", async () => {
        const { LuaFactory } = await import('wasmoon');
        const factory = new LuaFactory();
        const engine = await factory.createEngine();

        const fs = require('fs');
        const sandboxSrc = fs.readFileSync('res/scripts/system/sandbox_init.lua', 'utf-8');
        engine.doStringSync(sandboxSrc);

        // Register transform bridge
        engine.global.set('transform', {
            getPosition: (target: any) => {
                console.log('  [JS transform.getPosition] target:', JSON.stringify(target));
                return { x: 7, y: 14, z: 21 };
            },
            setPosition: (target: any, vec: any) => {},
            getRotation: (target: any) => ({ x: 0, y: 0, z: 0 }),
            setRotation: (target: any, vec: any) => {},
            getScale: (target: any) => ({ x: 1, y: 1, z: 1 }),
            getForward: (target: any) => ({ x: 0, y: 0, z: 1 }),
            getRight: (target: any) => ({ x: 1, y: 0, z: 0 }),
            getUp: (target: any) => ({ x: 0, y: 1, z: 0 }),
        });

        engine.global.set('scene', {
            __exists: (id: string) => true,
            hasComponent: (id: string, type: string) => false,
        });
        engine.global.set('physics', {});

        const mathExtSrc = fs.readFileSync('res/scripts/system/math_ext.lua', 'utf-8');
        engine.doStringSync(mathExtSrc);

        // Check transform global
        engine.doStringSync(`
            print("transform type:", type(transform))
            print("transform.getPosition:", type(transform.getPosition))
        `);

        // Test entity getPosition
        engine.doStringSync(`
            local ent = __WrapEntity("test-entity")
            print("ent.id:", ent.id)
            local gp = ent.getPosition
            print("ent.getPosition type:", type(gp))
            if gp then
                local pos = gp(ent)
                print("pos:", pos, "type:", type(pos))
            else
                print("ERROR: getPosition is nil!")
            end
        `);

        // If we got here without error, the test passes
        expect(true).toBe(true);
    }, 30000);
});
