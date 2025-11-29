import MouseInputService from '../application/MouseInputService';

describe('MouseInputService', () => {
  let service: MouseInputService;
  beforeEach(() => {
    service = new MouseInputService();
  });

  it('beginFrame() should reset deltaX/deltaY/wheelDelta but not locked', () => {
    // Simula estado previo
    (service as any).state.deltaX = 10;
    (service as any).state.deltaY = -5;
    (service as any).state.wheelDelta = 2;
    (service as any).state.locked = true;
    service.beginFrame();
    expect((service as any).state.deltaX).toBe(0);
    expect((service as any).state.deltaY).toBe(0);
    expect((service as any).state.wheelDelta).toBe(0);
    expect((service as any).state.locked).toBe(true);
  });

  it('onPointerLockChange() should set locked according to document.pointerLockElement', () => {
    const orig = global.document;
    // Simula document.pointerLockElement
    (global as any).document = { pointerLockElement: {} };
    service['onPointerLockChange']();
    expect((service as any).state.locked).toBe(true);
    (global as any).document = { pointerLockElement: null };
    service['onPointerLockChange']();
    expect((service as any).state.locked).toBe(false);
    (global as any).document = orig;
  });
});
