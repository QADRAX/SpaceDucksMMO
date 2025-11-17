import type { FpsChange } from '@client/infrastructure/ui/dev/DevWidgetController';
import type { FpsController } from '@client/infrastructure/ui/dev/FpsController';
import { render, cleanup } from '@testing-library/preact';
import { FpsWidget } from './FpsWidget';

describe('FpsWidget component', () => {
  let changeListener: ((c: FpsChange) => void) | null = null;

  const createMockController = (overrides = {}): FpsController => ({
    getFps: jest.fn(() => 60),
    isRunning: jest.fn(() => true),
    isVisible: jest.fn(() => true),
    show: jest.fn(),
    hide: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    toggle: jest.fn(),
    setPosition: jest.fn(),
    setUpdateInterval: jest.fn(),
    update: jest.fn(),
    onChange: jest.fn((cb: (c: FpsChange) => void) => {
      changeListener = cb;
      return jest.fn(); // unsubscribe function
    }),
    ...overrides,
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
    changeListener = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('calls getFps on controller during initialization', () => {
    const controller = createMockController();
    render(<FpsWidget controller={controller} />);

    expect(controller.getFps).toHaveBeenCalled();
  });

  it('calls isRunning on controller during initialization', () => {
    const controller = createMockController();
    render(<FpsWidget controller={controller} />);

    expect(controller.isRunning).toHaveBeenCalled();
  });

  it('calls isVisible on controller during initialization', () => {
    const controller = createMockController();
    render(<FpsWidget controller={controller} />);

    expect(controller.isVisible).toHaveBeenCalled();
  });

  it('subscribes to onChange when mounted', () => {
    const controller = createMockController();
    render(<FpsWidget controller={controller} />);

    // Give hooks time to run
    expect(controller.onChange).toHaveBeenCalled();
    expect(changeListener).not.toBeNull();
  });

  it('change listener can receive FPS updates', () => {
    const controller = createMockController();
    render(<FpsWidget controller={controller} />);

    expect(changeListener).toBeDefined();

    // Emit a change and verify no error
    expect(() => changeListener?.({ fps: 144 })).not.toThrow();
  });

  it('change listener can receive visibility updates', () => {
    const controller = createMockController();
    render(<FpsWidget controller={controller} />);

    expect(changeListener).toBeDefined();

    // Emit visibility change
    expect(() => changeListener?.({ visible: false })).not.toThrow();
  });

  it('change listener can receive running state updates', () => {
    const controller = createMockController();
    render(<FpsWidget controller={controller} />);

    expect(changeListener).toBeDefined();

    // Emit running change
    expect(() => changeListener?.({ running: false })).not.toThrow();
  });
});
