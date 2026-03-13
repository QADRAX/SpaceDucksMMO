/** @jest-environment node */
/**
 * Performance tests for Script System.
 * IMPORTANT: keep @jest-environment node as the first docblock for wasmoon compatibility.
 */
jest.unmock('wasmoon');

import { Entity } from '../../domain/ecs/core/Entity';
import { ScriptComponent } from '../../domain/ecs/components/scripting/ScriptComponent';
import { DefaultEcsComponentFactory } from '../../domain/ecs/core/ComponentFactory';
import { ScriptSystem } from '../../domain/scripting/ScriptSystem';
import { SceneTestScaffold } from '../utils/SceneTestScaffold';
import {
  benchmark,
  compareBenchmarks,
  frameBudgetMs,
  printBenchmarkResults,
  TARGET_FPS,
  expectBenchmarkWithinFrameBudget,
  expectBenchmarkFasterThan
} from './BenchmarkUtils';

describe('Performance: Script System', () => {
  describe('Script Compilation', () => {
    it('should compile 100 simple scripts efficiently', async () => {
      const simpleScript = `
        return {
          init = function(self)
            self.counter = 0
          end,
          update = function(self, dt)
            self.counter = self.counter + 1
          end
        }
      `;

      const result = await benchmark(
        'Compile 100 simple scripts',
        async () => {
          const scriptSystem = new ScriptSystem(
            new DefaultEcsComponentFactory(),
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            {},
            { 'test://simple.lua': simpleScript }
          );

          const entities = new Map<string, Entity>();
          for (let i = 0; i < 100; i++) {
            const entity = new Entity(`entity_${i}`);
            const scriptComp = new ScriptComponent();
            scriptComp.addSlot('test://simple.lua');
            entity.addComponent(scriptComp);
            entities.set(entity.id, entity);
          }

          await scriptSystem.setupAsync(entities, {
            subscribeChanges: () => () => {},
            removeEntity: () => {}
          });
        },
        { iterations: 10, warmupIterations: 2, maxTime: 30000 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 1000, 'Script compilation should be reasonably fast');
    });

    it('should handle compilation of scripts with different complexities', async () => {
      const scripts = {
        'test://minimal.lua': `return { update = function() end }`,
        'test://simple.lua': `
          return {
            init = function(self) self.x = 0 end,
            update = function(self, dt) self.x = self.x + dt end
          }
        `,
        'test://complex.lua': `
          local Vector3 = require("math.Vector3")
          return {
            init = function(self)
              self.velocity = Vector3.new(1, 0, 0)
              self.position = Vector3.new(0, 0, 0)
            end,
            update = function(self, dt)
              self.position = self.position + self.velocity * dt
              self.velocity.y = self.velocity.y - 9.8 * dt
            end
          }
        `
      };

      const results = await compareBenchmarks([
        {
          name: 'Minimal scripts (100)',
          fn: async () => {
            const ss = new ScriptSystem(
              new DefaultEcsComponentFactory(),
              false, undefined, undefined, undefined, undefined,
              {}, { 'test://minimal.lua': scripts['test://minimal.lua'] }
            );
            const entities = new Map<string, Entity>();
            for (let i = 0; i < 100; i++) {
              const e = new Entity(`e_${i}`);
              const sc = new ScriptComponent();
              sc.addSlot('test://minimal.lua');
              e.addComponent(sc);
              entities.set(e.id, e);
            }
            await ss.setupAsync(entities, {
              subscribeChanges: () => () => {},
              removeEntity: () => {}
            });
          }
        },
        {
          name: 'Simple scripts (100)',
          fn: async () => {
            const ss = new ScriptSystem(
              new DefaultEcsComponentFactory(),
              false, undefined, undefined, undefined, undefined,
              {}, { 'test://simple.lua': scripts['test://simple.lua'] }
            );
            const entities = new Map<string, Entity>();
            for (let i = 0; i < 100; i++) {
              const e = new Entity(`e_${i}`);
              const sc = new ScriptComponent();
              sc.addSlot('test://simple.lua');
              e.addComponent(sc);
              entities.set(e.id, e);
            }
            await ss.setupAsync(entities, {
              subscribeChanges: () => () => {},
              removeEntity: () => {}
            });
          }
        }
      ], { iterations: 5, maxTime: 60000 });

      printBenchmarkResults(results);
    });
  });

  describe('Script Execution', () => {
    it('should execute 100 update hooks within frame budget (144 FPS target)', async () => {
      const simpleScript = `
        return {
          init = function(self)
            self.counter = 0
          end,
          update = function(self, dt)
            self.counter = self.counter + 1
          end
        }
      `;

      const scriptSystem = new ScriptSystem(
        new DefaultEcsComponentFactory(),
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        {},
        { 'test://simple.lua': simpleScript }
      );

      const entities = new Map<string, Entity>();
      for (let i = 0; i < 100; i++) {
        const entity = new Entity(`entity_${i}`);
        const scriptComp = new ScriptComponent();
        scriptComp.addSlot('test://simple.lua');
        entity.addComponent(scriptComp);
        entities.set(entity.id, entity);
      }

      await scriptSystem.setupAsync(entities, {
        subscribeChanges: () => () => {},
        removeEntity: () => {}
      });

      // Warmup
      scriptSystem.update(16);
      scriptSystem.update(16);

      const result = await benchmark(
        'Execute 100 script updates',
        () => {
          scriptSystem.update(16);
        },
        { iterations: 60 }
      );

      const frameBudget = frameBudgetMs(TARGET_FPS);
      console.log(`\n${result.name}: ${result.avgTime.toFixed(4)}ms avg`);
      console.log(`  ${TARGET_FPS} FPS budget (${frameBudget.toFixed(2)}ms): ${result.avgTime < frameBudget ? 'PASS' : 'FAIL'}`);
      
      expectBenchmarkWithinFrameBudget(result, {
        targetFps: TARGET_FPS,
        message: `Should execute within ${TARGET_FPS} FPS budget`
      });
    });

    it('should test script execution with Transform access', async () => {
      const transformScript = `
        local Vector3 = require("math.Vector3")
        return {
          init = function(self)
            self.speed = 10
            self.direction = Vector3.new(1, 0, 0)
          end,
          update = function(self, dt)
            local pos = self.entity:getPosition()
            local newPos = pos + self.direction * self.speed * dt
            self.entity:setPosition(newPos.x, newPos.y, newPos.z)
          end
        }
      `;

      const scriptSystem = new ScriptSystem(
        new DefaultEcsComponentFactory(),
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        {},
        { 'test://movement.lua': transformScript }
      );

      const entities = new Map<string, Entity>();
      for (let i = 0; i < 100; i++) {
        const entity = new Entity(`entity_${i}`);
        const scriptComp = new ScriptComponent();
        scriptComp.addSlot('test://movement.lua');
        entity.addComponent(scriptComp);
        entities.set(entity.id, entity);
      }

      await scriptSystem.setupAsync(entities, {
        subscribeChanges: () => () => {},
        removeEntity: () => {}
      });

      // Warmup
      scriptSystem.update(0.016);

      const result = await benchmark(
        'Execute 100 scripts with Transform updates',
        () => {
          scriptSystem.update(0.016);
        },
        { iterations: 60 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(4)}ms avg`);
      expectBenchmarkWithinFrameBudget(result, {
        targetFps: TARGET_FPS,
        message: `Transform updates should fit ${TARGET_FPS} FPS budget`
      });
    });
  });

  describe('Script Lifecycle', () => {
    it('should test full lifecycle performance', async () => {
      const lifecycleScript = `
        return {
          init = function(self)
            self.data = {}
          end,
          earlyUpdate = function(self, dt)
            self.data.early = true
          end,
          update = function(self, dt)
            self.data.update = true
          end,
          lateUpdate = function(self, dt)
            self.data.late = true
          end
        }
      `;

      const scriptSystem = new ScriptSystem(
        new DefaultEcsComponentFactory(),
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        {},
        { 'test://lifecycle.lua': lifecycleScript }
      );

      const entities = new Map<string, Entity>();
      for (let i = 0; i < 100; i++) {
        const entity = new Entity(`entity_${i}`);
        const scriptComp = new ScriptComponent();
        scriptComp.addSlot('test://lifecycle.lua');
        entity.addComponent(scriptComp);
        entities.set(entity.id, entity);
      }

      await scriptSystem.setupAsync(entities, {
        subscribeChanges: () => () => {},
        removeEntity: () => {}
      });

      const earlyResult = await benchmark(
        'Lifecycle: earlyUpdate only',
        () => {
          scriptSystem.earlyUpdate(16);
        },
        { iterations: 60 }
      );

      const updateResult = await benchmark(
        'Lifecycle: update only',
        () => {
          scriptSystem.update(16);
        },
        { iterations: 60 }
      );

      const lateResult = await benchmark(
        'Lifecycle: lateUpdate only',
        () => {
          scriptSystem.lateUpdate(16);
        },
        { iterations: 60 }
      );

      const result = await benchmark(
        'Full lifecycle (early + update + late)',
        () => {
          scriptSystem.earlyUpdate(16);
          scriptSystem.update(16);
          scriptSystem.lateUpdate(16);
        },
        { iterations: 60 }
      );

      const phaseSum = earlyResult.avgTime + updateResult.avgTime + lateResult.avgTime;
      const frameBudget = frameBudgetMs(TARGET_FPS);

      console.log('\nLifecycle breakdown:');
      console.log(`  earlyUpdate: ${earlyResult.avgTime.toFixed(4)}ms (${((earlyResult.avgTime / phaseSum) * 100).toFixed(1)}%)`);
      console.log(`  update: ${updateResult.avgTime.toFixed(4)}ms (${((updateResult.avgTime / phaseSum) * 100).toFixed(1)}%)`);
      console.log(`  lateUpdate: ${lateResult.avgTime.toFixed(4)}ms (${((lateResult.avgTime / phaseSum) * 100).toFixed(1)}%)`);
      console.log(`  1-frame ${TARGET_FPS} FPS budget (${frameBudget.toFixed(2)}ms): ${phaseSum <= frameBudget ? 'PASS' : 'FAIL'}`);

      console.log(`\n${result.name}: ${result.avgTime.toFixed(4)}ms avg`);
      expectBenchmarkFasterThan(result, 35, 'Full lifecycle should be within benchmark budget');
    });
  });

  describe('Script System Overhead', () => {
    it('should measure Lua bridge overhead', async () => {
      // Script that does minimal work
      const noOpScript = `return { update = function() end }`;
      
      // Script that accesses bridge frequently
      const bridgeScript = `
        return {
          update = function(self, dt)
            local pos = self.entity:getPosition()
            self.entity:setPosition(pos.x, pos.y, pos.z)
          end
        }
      `;

      const results = await compareBenchmarks([
        {
          name: 'No-op scripts',
          fn: async () => {
            const ss = new ScriptSystem(
              new DefaultEcsComponentFactory(),
              false, undefined, undefined, undefined, undefined,
              {}, { 'test://noop.lua': noOpScript }
            );
            const entities = new Map<string, Entity>();
            for (let i = 0; i < 50; i++) {
              const e = new Entity(`e_${i}`);
              const sc = new ScriptComponent();
              sc.addSlot('test://noop.lua');
              e.addComponent(sc);
              entities.set(e.id, e);
            }
            await ss.setupAsync(entities, {
              subscribeChanges: () => () => {},
              removeEntity: () => {}
            });
            
            // Execute
            ss.update(16);
          }
        },
        {
          name: 'Bridge-heavy scripts',
          fn: async () => {
            const ss = new ScriptSystem(
              new DefaultEcsComponentFactory(),
              false, undefined, undefined, undefined, undefined,
              {}, { 'test://bridge.lua': bridgeScript }
            );
            const entities = new Map<string, Entity>();
            for (let i = 0; i < 50; i++) {
              const e = new Entity(`e_${i}`);
              const sc = new ScriptComponent();
              sc.addSlot('test://bridge.lua');
              e.addComponent(sc);
              entities.set(e.id, e);
            }
            await ss.setupAsync(entities, {
              subscribeChanges: () => () => {},
              removeEntity: () => {}
            });
            
            // Execute
            ss.update(16);
          }
        }
      ], { iterations: 10, maxTime: 60000 });

      printBenchmarkResults(results);
      
      console.log('\nBridge overhead analysis:');
      const overhead = results[1].avgTime - results[0].avgTime;
      console.log(`  Overhead per frame: ${overhead.toFixed(4)}ms`);
      console.log(`  Overhead per script: ${(overhead / 50).toFixed(4)}ms`);
    });
  });

  describe('Real-world Scenario', () => {
    it('should handle realistic game scenario (100 entities, mixed scripts) at 144 FPS target', async () => {
      const scaffold = new SceneTestScaffold({
        'test://movement.lua': `
          local Vector3 = require("math.Vector3")
          return {
            init = function(self)
              self.velocity = Vector3.new(
                math.random() * 2 - 1,
                math.random() * 2 - 1,
                math.random() * 2 - 1
              )
            end,
            update = function(self, dt)
              local pos = self.entity:getPosition()
              local newPos = pos + self.velocity * dt
              self.entity:setPosition(newPos.x, newPos.y, newPos.z)
            end
          }
        `,
        'test://rotation.lua': `
          return {
            init = function(self)
              self.rotSpeed = math.random() * 2
            end,
            update = function(self, dt)
              local rot = self.entity:getRotation()
              self.entity:setRotation(rot.x, rot.y + self.rotSpeed * dt, rot.z)
            end
          }
        `
      });

      // Create 100 entities with mixed scripts
      for (let i = 0; i < 100; i++) {
        const scriptId = i % 2 === 0 ? 'test://movement.lua' : 'test://rotation.lua';
        scaffold.spawnScriptedEntity(`entity_${i}`, scriptId);
      }

      await scaffold.wait();

      // Warmup
      scaffold.tick(16);
      scaffold.tick(16);

      const result = await benchmark(
        'Realistic game frame (100 entities)',
        () => {
          scaffold.tick(16);
        },
        { iterations: 60 }
      );

      const frameBudget = frameBudgetMs(TARGET_FPS);
      console.log(`\n${result.name}:`);
      console.log(`  Avg time: ${result.avgTime.toFixed(4)}ms`);
      console.log(`  FPS: ${(1000 / result.avgTime).toFixed(1)}`);
      console.log(`  ${TARGET_FPS} FPS budget (${frameBudget.toFixed(2)}ms): ${result.avgTime < frameBudget ? 'PASS' : 'FAIL'}`);
      
      expectBenchmarkWithinFrameBudget(result, {
        targetFps: TARGET_FPS,
        message: `Realistic scenario should meet ${TARGET_FPS} FPS`
      });
    });
  });
});
