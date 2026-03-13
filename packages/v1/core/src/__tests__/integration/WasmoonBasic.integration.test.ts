/** @jest-environment node */
jest.unmock('wasmoon');

describe("Wasmoon basic", () => {
    it("can create engine", async () => {
        console.log("START: importing wasmoon...");
        const { LuaFactory } = await import('wasmoon');
        console.log("LuaFactory imported:", typeof LuaFactory);
        const f = new LuaFactory();
        console.log("Factory created, creating engine...");
        const e = await f.createEngine();
        console.log("Engine created:", typeof e.global.get);
        e.doStringSync("x = 42");
        const x = e.global.get("x");
        console.log("Got x:", x);
        expect(x).toBe(42);
    }, 30000);
});
