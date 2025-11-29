import { FpsController } from './FpsController';

describe('FpsController', () => {
  it('starts/stops and notifies listeners on update', () => {
    const c = new FpsController();
    const values: number[] = [];
    const unsub = c.onChange((ch) => { if (ch.fps !== undefined) values.push(Number(ch.fps)); });

    c.setUpdateInterval(0); // make updates emit immediately for the test
    c.start();
    // simulate several updates
    c.update();
    c.update();
    c.stop();

    expect(values.length).toBeGreaterThanOrEqual(1);
    unsub();
  });
});
