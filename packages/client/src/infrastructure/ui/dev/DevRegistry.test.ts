import DevRegistry from './DevRegistry';

describe('DevRegistry', () => {
  it('registers and unregisters widgets', () => {
    const r = new DevRegistry();
    const widget = { id: 'w1', render: () => ({ foo: 'bar' }) };
    const unsub = r.register(widget as any);
    const widgets = r.getWidgets();
    expect(widgets.length).toBe(1);
    expect(widgets[0].id).toBe('w1');
    unsub();
    expect(r.getWidgets().length).toBe(0);
  });
});
