import { FpsWidget } from './FpsWidget';
import { h } from 'preact';

// Minimal smoke test: calling the component returns a vnode-like object
describe('FpsWidget component', () => {
  it('creates vnode when invoked', () => {
    // create a minimal controller stub
    const controller: any = {
      getFps: () => 60,
      isRunning: () => true,
      isVisible: () => true,
      onChange: (cb: any) => { cb({ fps: 60, visible: true, running: true }); return () => {}; },
    };

    const vnode = FpsWidget({ controller, updateIntervalMs: 100 });
    expect(vnode).not.toBeNull();
    // vnode can be a Preact VNode; basic check for props presence
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asAny: any = vnode;
    expect(asAny.props).toBeDefined();
  });
});
