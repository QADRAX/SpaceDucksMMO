import SceneManager from './SceneManager';

describe('SceneManager debug passthrough', () => {
  it('forwards subscribeChanges and getEntities to active scene', () => {
    const events: any[] = [];
    // minimal mock engine
    const engine: any = { setScene: () => {} };
    const settingsService: any = {};
    const manager = new SceneManager(engine, settingsService);

    // mock scene with optional debug API
    const mockScene: any = {
      id: 'mock',
      setup: () => Promise.resolve(),
      update: (_dt: number) => {},
      teardown: () => Promise.resolve(),
      addEntity: (_e: any) => {},
      removeEntity: (_id: string) => {},
      setActiveCamera: (_id: string) => {},
      getActiveCamera: () => null,
      getEntities: () => [{ id: 'e1' }],
      subscribeChanges: (listener: (ev: any) => void) => {
        // emit one event asynchronously
        setTimeout(() => listener({ kind: 'entity-added', entity: { id: 'e1' } }), 0);
        return () => {};
      },
      reparentEntity: (_c: string, _p: string | null) => {},
    };

    manager.register(mockScene);
    manager.switchTo('mock');

    const ents = manager.getEntities();
    expect(ents.length).toBe(1);
    const unsub = manager.subscribeToSceneChanges((ev) => events.push(ev));

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(events.length).toBeGreaterThanOrEqual(1);
        expect(events[0].kind).toBe('entity-added');
        unsub();
        resolve(undefined);
      }, 20);
    });
  });

  it('getEntities returns empty and subscribe is noop when no active scene', () => {
    const engine: any = { setScene: () => {} };
    const settingsService: any = {};
    const manager = new (SceneManager as any)(engine, settingsService);

    const ents = manager.getEntities();
    expect(Array.isArray(ents)).toBe(true);
    expect(ents.length).toBe(0);

    // subscribe should be callable and return a function
    const unsub = manager.subscribeToSceneChanges(() => { throw new Error('should not be called'); });
    expect(typeof unsub).toBe('function');
    // calling unsubscribe should be a noop
    expect(() => unsub()).not.toThrow();
  });

  it('reparentEntity is noop when current scene does not support it', () => {
    const engine: any = { setScene: () => {} };
    const settingsService: any = {};
    const manager = new (SceneManager as any)(engine, settingsService);

    const mockScene: any = {
      id: 's1',
      setup: () => Promise.resolve(),
      update: (_: number) => {},
      teardown: () => Promise.resolve(),
      addEntity: () => {},
      removeEntity: () => {},
      setActiveCamera: () => {},
      getActiveCamera: () => null,
      // intentionally no reparentEntity
    };

    manager.register(mockScene);
    manager.switchTo('s1');

    // should not throw
    expect(() => manager.reparentEntity('a', 'b')).not.toThrow();
  });

  it('subscriptions bind to current scene and unsubscribe works across scenes', (done) => {
    const engine: any = { setScene: () => {} };
    const settingsService: any = {};
    const manager = new (SceneManager as any)(engine, settingsService);

    // create two scenes which allow manual emission
    const listenersA: Array<(ev: any) => void> = [];
    const sceneA: any = {
      id: 'A',
      setup: () => Promise.resolve(),
      update: (_: number) => {},
      teardown: () => Promise.resolve(),
      addEntity: () => {},
      removeEntity: () => {},
      setActiveCamera: () => {},
      getActiveCamera: () => null,
      getEntities: () => [],
      subscribeChanges: (l: (ev: any) => void) => { listenersA.push(l); return () => { const i = listenersA.indexOf(l); if (i>=0) listenersA.splice(i,1); }; }
    };

    const listenersB: Array<(ev: any) => void> = [];
    const sceneB: any = {
      id: 'B',
      setup: () => Promise.resolve(),
      update: (_: number) => {},
      teardown: () => Promise.resolve(),
      addEntity: () => {},
      removeEntity: () => {},
      setActiveCamera: () => {},
      getActiveCamera: () => null,
      getEntities: () => [],
      subscribeChanges: (l: (ev: any) => void) => { listenersB.push(l); return () => { const i = listenersB.indexOf(l); if (i>=0) listenersB.splice(i,1); }; }
    };

    manager.register(sceneA);
    manager.register(sceneB);

    manager.switchTo('A');
    const events: any[] = [];
    const unsubA = manager.subscribeToSceneChanges((ev: any) => events.push(['A', ev]));

    // emit on sceneA
    listenersA.forEach((l) => l({ kind: 'entity-added', entity: { id: 'xa' } }));

    // switch to B and subscribe again
    manager.switchTo('B');
    const unsubB = manager.subscribeToSceneChanges((ev: any) => events.push(['B', ev]));

    // emit on B
    listenersB.forEach((l) => l({ kind: 'entity-added', entity: { id: 'yb' } }));

    // small timeout to allow sync handlers
    setTimeout(() => {
      // we should have received an event from A and one from B
      const foundA = events.find((e) => e[0]==='A');
      const foundB = events.find((e) => e[0]==='B');
      expect(foundA).toBeDefined();
      expect(foundB).toBeDefined();

      // unsubscribe and ensure no further events
      unsubA();
      unsubB();
      listenersA.forEach((l) => l({ kind: 'entity-added', entity: { id: 'xa2' } }));
      listenersB.forEach((l) => l({ kind: 'entity-added', entity: { id: 'yb2' } }));

      setTimeout(() => {
        const moreA = events.find((e) => e[0]==='A' && e[1].entity.id==='xa2');
        const moreB = events.find((e) => e[0]==='B' && e[1].entity.id==='yb2');
        expect(moreA).toBeUndefined();
        expect(moreB).toBeUndefined();
        done();
      }, 10);
    }, 10);
  }, 1000);

  it('listeners registered before switch receive events from the new scene', (done) => {
    const engine: any = { setScene: () => {} };
    const settingsService: any = {};
    const manager = new (SceneManager as any)(engine, settingsService);

    const listenersA: Array<(ev: any) => void> = [];
    const sceneA: any = {
      id: 'A',
      setup: () => Promise.resolve(),
      update: (_: number) => {},
      teardown: () => Promise.resolve(),
      addEntity: () => {},
      removeEntity: () => {},
      setActiveCamera: () => {},
      getActiveCamera: () => null,
      getEntities: () => [],
      subscribeChanges: (l: (ev: any) => void) => { listenersA.push(l); return () => { const i = listenersA.indexOf(l); if (i>=0) listenersA.splice(i,1); }; }
    };

    const listenersB: Array<(ev: any) => void> = [];
    const sceneB: any = {
      id: 'B',
      setup: () => Promise.resolve(),
      update: (_: number) => {},
      teardown: () => Promise.resolve(),
      addEntity: () => {},
      removeEntity: () => {},
      setActiveCamera: () => {},
      getActiveCamera: () => null,
      getEntities: () => [],
      subscribeChanges: (l: (ev: any) => void) => { listenersB.push(l); return () => { const i = listenersB.indexOf(l); if (i>=0) listenersB.splice(i,1); }; }
    };

    manager.register(sceneA);
    manager.register(sceneB);

    // start on A
    manager.switchTo('A');

    const events: any[] = [];
    // subscribe while A is active
    const unsub = manager.subscribeToSceneChanges((ev: any) => events.push(ev));

    // switch to B - the manager should unbind A and bind B, forwarding events to our listener
    manager.switchTo('B');

    // emit on B
    listenersB.forEach((l) => l({ kind: 'entity-added', entity: { id: 'yb' } }));

    setTimeout(() => {
      expect(events.find((e) => e.kind === 'entity-added' && e.entity.id === 'yb')).toBeDefined();
      // cleanup
      unsub();
      done();
    }, 10);
  });

  it('listeners registered before any active scene bind when a scene becomes active', (done) => {
    const engine: any = { setScene: () => {} };
    const settingsService: any = {};
    const manager = new (SceneManager as any)(engine, settingsService);

    const listeners: Array<(ev: any) => void> = [];
    const scene: any = {
      id: 'S',
      setup: () => Promise.resolve(),
      update: (_: number) => {},
      teardown: () => Promise.resolve(),
      addEntity: () => {},
      removeEntity: () => {},
      setActiveCamera: () => {},
      getActiveCamera: () => null,
      getEntities: () => [],
      subscribeChanges: (l: (ev: any) => void) => { listeners.push(l); return () => { const i = listeners.indexOf(l); if (i>=0) listeners.splice(i,1); }; }
    };

    const events: any[] = [];
    // subscribe BEFORE any scene is active
    const unsub = manager.subscribeToSceneChanges((ev: any) => events.push(ev));

    // now register and switch to scene; manager should bind our listener
    manager.register(scene);
    manager.switchTo('S');

    // emit
    listeners.forEach((l) => l({ kind: 'entity-removed', entityId: 'z' }));

    setTimeout(() => {
      expect(events.find((e) => e.kind === 'entity-removed' && e.entityId === 'z')).toBeDefined();
      unsub();
      done();
    }, 10);
  });
});
