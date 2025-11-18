import KeyboardInputService from './KeyboardInputService';

describe('KeyboardInputService', () => {
  let service: KeyboardInputService;

  beforeEach(() => {
    service = new KeyboardInputService();
  });

  afterEach(() => {
    service.dispose();
  });

  it('tracks keydown and keyup state via isKeyPressed', () => {
    const ev = new KeyboardEvent('keydown', { key: 'A' });
    window.dispatchEvent(ev);
    expect(service.isKeyPressed('A')).toBe(true);

    const up = new KeyboardEvent('keyup', { key: 'A' });
    window.dispatchEvent(up);
    expect(service.isKeyPressed('A')).toBe(false);
  });

  it('calls onKeyDown handlers and supports unsubscribe', () => {
    const handler = jest.fn();
    const off = service.onKeyDown('B', handler);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'B' }));
    expect(handler).toHaveBeenCalled();
    off();
    handler.mockClear();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'B' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls onKeyUp handlers and supports unsubscribe', () => {
    const handler = jest.fn();
    const off = service.onKeyUp('C', handler);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'C' }));
    expect(handler).toHaveBeenCalled();
    off();
    handler.mockClear();
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'C' }));
    expect(handler).not.toHaveBeenCalled();
  });
});
