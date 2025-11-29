import KeyboardInputService from './KeyboardInputService';

describe('KeyboardInputService', () => {
  let service: KeyboardInputService;

  beforeEach(() => {
    service = new KeyboardInputService();
  });

  afterEach(() => {
    service.dispose();
  });

  it('tracks keydown and keyup state via isKeyPressed (normalized)', () => {
    const ev = new KeyboardEvent('keydown', { key: 'A' });
    window.dispatchEvent(ev);
    expect(service.isKeyPressed('a')).toBe(true);

    const up = new KeyboardEvent('keyup', { key: 'A' });
    window.dispatchEvent(up);
    expect(service.isKeyPressed('a')).toBe(false);
  });

  it('calls onKeyDown handlers and supports unsubscribe (normalized)', () => {
    const handler = jest.fn();
    const off = service.onKeyDown('b', handler);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'B' }));
    expect(handler).toHaveBeenCalled();
    off();
    handler.mockClear();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'B' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls onKeyUp handlers and supports unsubscribe (normalized)', () => {
    const handler = jest.fn();
    const off = service.onKeyUp('c', handler);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'C' }));
    expect(handler).toHaveBeenCalled();
    off();
    handler.mockClear();
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'C' }));
    expect(handler).not.toHaveBeenCalled();
  });
});
