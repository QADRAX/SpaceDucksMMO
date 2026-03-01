import { registerInputBridge } from "./InputBridge";
import { setInputServices, getInputServices } from "../../ecs";

describe("InputBridge", () => {
    let mockEngine: any;
    let inputApi: any;

    beforeEach(() => {
        mockEngine = {
            global: {
                set: jest.fn((key, value) => {
                    if (key === "Input") inputApi = value;
                })
            }
        };
    });

    it("registers input api", () => {
        registerInputBridge(mockEngine);
        expect(mockEngine.global.set).toHaveBeenCalledWith("Input", expect.any(Object));
    });

    it("queries keyboard state", () => {
        const isKeyPressedMock = jest.fn().mockReturnValue(true);
        setInputServices({
            keyboard: {
                isKeyPressed: isKeyPressedMock,
                onKeyDown: jest.fn(),
                onKeyUp: jest.fn()
            } as any
        });

        registerInputBridge(mockEngine);
        const result = inputApi.isKeyPressed("Space");

        expect(isKeyPressedMock).toHaveBeenCalledWith("Space");
        expect(result).toBe(true);
    });

    it("queries mouse state", () => {
        const getStateMock = jest.fn().mockReturnValue({
            locked: false,
            buttons: { left: true, middle: false, right: false },
            screenX: 0, screenY: 0, deltaX: 5, deltaY: 10, wheelDelta: 0
        });

        setInputServices({
            mouse: {
                getState: getStateMock
            } as any
        });

        registerInputBridge(mockEngine);

        const delta = inputApi.getMouseDelta();
        expect(delta).toEqual({ x: 5, y: 10 });

        const buttons = inputApi.getMouseButtons();
        expect(buttons).toEqual({ left: true, right: false, middle: false });
    });
});
