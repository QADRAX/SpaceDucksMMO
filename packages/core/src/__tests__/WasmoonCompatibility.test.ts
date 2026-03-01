import { LuaFactory } from 'wasmoon';

describe('Wasmoon Compatibility', () => {
    it('should create a Lua engine', async () => {
        console.log('Creating Lua factory...');
        const factory = new LuaFactory();
        console.log('Creating Lua engine...');
        const engine = await factory.createEngine();
        console.log('Engine created successfully!');

        const result = engine.doStringSync('return 1 + 1');
        expect(result).toBe(2);
        console.log('Execution successful!');
    }, 15000);
});
