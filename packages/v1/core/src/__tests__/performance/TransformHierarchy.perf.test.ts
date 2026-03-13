/**
 * Performance tests for Transform and hierarchy operations
 */

import { Entity } from '../../domain/ecs/core/Entity';
import {
  benchmark,
  compareBenchmarks,
  printBenchmarkResults,
  expectBenchmarkFasterThan
} from './BenchmarkUtils';

describe('Performance: Transform System', () => {
  describe('Transform Updates', () => {
    it('should update positions efficiently', async () => {
      const entities = Array.from({ length: 10_000 }, (_, i) => new Entity(`entity_${i}`));

      const result = await benchmark(
        'Update 10k entity positions',
        () => {
          entities.forEach((entity, i) => {
            entity.transform.setPosition(
              Math.sin(i * 0.01),
              Math.cos(i * 0.01),
              i * 0.1
            );
          });
        },
        { iterations: 50 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 20, 'Position updates should be fast');
    });

    it('should update rotations efficiently', async () => {
      const entities = Array.from({ length: 10_000 }, (_, i) => new Entity(`entity_${i}`));

      const result = await benchmark(
        'Update 10k entity rotations',
        () => {
          entities.forEach((entity, i) => {
            entity.transform.setRotation(i * 0.01, i * 0.02, i * 0.03);
          });
        },
        { iterations: 50 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 20, 'Rotation updates should be fast');
    });

    it('should update scales efficiently', async () => {
      const entities = Array.from({ length: 10_000 }, (_, i) => new Entity(`entity_${i}`));

      const result = await benchmark(
        'Update 10k entity scales',
        () => {
          entities.forEach((entity, i) => {
            const scale = 1 + Math.sin(i * 0.01) * 0.5;
            entity.transform.setScale(scale, scale, scale);
          });
        },
        { iterations: 50 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 20, 'Scale updates should be fast');
    });
  });

  describe('World Transform Calculation', () => {
    it('should calculate world position efficiently for flat hierarchy', async () => {
      const root = new Entity('root');
      const children = Array.from({ length: 1_000 }, (_, i) => {
        const child = new Entity(`child_${i}`);
        child.transform.setPosition(i, 0, 0);
        root.addChild(child);
        return child;
      });

      const result = await benchmark(
        'Calculate world positions (1k flat children)',
        () => {
          root.transform.setPosition(100, 0, 0);
          children.forEach(child => {
            const _ = child.transform.worldPosition;
          });
        },
        { iterations: 50 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 20, 'World position calculation should be fast');
    });

    it('should handle deep hierarchy (1000 levels) efficiently', async () => {
      let root = new Entity('root');
      let current = root;
      let deepest: Entity = root;

      // Build deep hierarchy
      for (let i = 0; i < 1_000; i++) {
        const child = new Entity(`child_${i}`);
        child.transform.setPosition(1, 0, 0); // Offset by 1
        current.addChild(child);
        current = child;
        deepest = child;
      }

      const result = await benchmark(
        'World position calc (1k deep hierarchy)',
        () => {
          root.transform.setPosition(10, 0, 0);
          const worldPos = deepest.transform.worldPosition;
          // Verify correctness
          if (Math.abs(worldPos.x - 1010) > 0.01) {
            throw new Error(`Expected world pos X to be ~1010, got ${worldPos.x}`);
          }
        },
        { iterations: 20 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 10, 'Deep hierarchy world transform should be reasonably fast');
    });

    it('should handle wide hierarchy (1000 children) efficiently', async () => {
      const root = new Entity('root');
      const children: Entity[] = [];

      // Create 1,000 children
      for (let i = 0; i < 1_000; i++) {
        const child = new Entity(`child_${i}`);
        child.transform.setPosition(i, 0, 0);
        root.addChild(child);
        children.push(child);
      }

      const result = await benchmark(
        'World position calc (1k wide hierarchy)',
        () => {
          root.transform.setPosition(100, 0, 0);
          children.forEach(child => {
            const _ = child.transform.worldPosition;
          });
        },
        { iterations: 50 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 30, 'Wide hierarchy world transform should be fast');
    });

    it('should handle complex hierarchy efficiently', async () => {
      const root = new Entity('root');
      
      // Build a tree: root -> 10 branches -> 100 leaves each (1000 total entities)
      for (let b = 0; b < 10; b++) {
        const branch = new Entity(`branch_${b}`);
        branch.transform.setPosition(b * 10, 0, 0);
        root.addChild(branch);

        for (let l = 0; l < 100; l++) {
          const leaf = new Entity(`leaf_${b}_${l}`);
          leaf.transform.setPosition(l, l, l);
          branch.addChild(leaf);
        }
      }

      const allEntities: Entity[] = [root];
      const collectEntities = (entity: Entity) => {
        entity.getChildren().forEach(child => {
          allEntities.push(child);
          collectEntities(child);
        });
      };
      collectEntities(root);

      const result = await benchmark(
        'World position calc (complex tree)',
        () => {
          root.transform.setPosition(Math.random() * 10, 0, 0);
          allEntities.forEach(entity => {
            const _ = entity.transform.worldPosition;
          });
        },
        { iterations: 30 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg (${allEntities.length} entities)`);
      expectBenchmarkFasterThan(result, 50, 'Complex hierarchy should be reasonably fast');
    });
  });

  describe('Transform Comparisons', () => {
    it('should compare different transform operations', async () => {
      const entities = Array.from({ length: 1_000 }, (_, i) => new Entity(`entity_${i}`));

      const results = await compareBenchmarks([
        {
          name: 'setPosition',
          fn: () => {
            entities.forEach(e => e.transform.setPosition(1, 2, 3));
          }
        },
        {
          name: 'setRotation',
          fn: () => {
            entities.forEach(e => e.transform.setRotation(0.1, 0.2, 0.3));
          }
        },
        {
          name: 'setScale',
          fn: () => {
            entities.forEach(e => e.transform.setScale(1.5, 1.5, 1.5));
          }
        },
        {
          name: 'all transforms',
          fn: () => {
            entities.forEach(e => {
              e.transform.setPosition(1, 2, 3);
              e.transform.setRotation(0.1, 0.2, 0.3);
              e.transform.setScale(1.5, 1.5, 1.5);
            });
          }
        }
      ], { iterations: 100 });

      printBenchmarkResults(results);
    });
  });

  describe('Transform Caching', () => {
    it('should benefit from world transform caching', async () => {
      const root = new Entity('root');
      const child = new Entity('child');
      child.transform.setPosition(10, 0, 0);
      root.addChild(child);

      // First access (should calculate)
      const firstResult = await benchmark(
        'First world position access',
        () => {
          for (let i = 0; i < 10_000; i++) {
            root.transform.setPosition(i, 0, 0);
            const _ = child.transform.worldPosition;
          }
        },
        { iterations: 50 }
      );

      // Repeated access without changes (should use cache if implemented)
      const cachedResult = await benchmark(
        'Repeated world position access',
        () => {
          for (let i = 0; i < 10_000; i++) {
            const _ = child.transform.worldPosition;
          }
        },
        { iterations: 50 }
      );

      console.log(`\nCaching benefit:`);
      console.log(`  With recalc: ${firstResult.avgTime.toFixed(4)}ms`);
      console.log(`  Cached: ${cachedResult.avgTime.toFixed(4)}ms`);
      console.log(`  Speedup: ${(firstResult.avgTime / cachedResult.avgTime).toFixed(2)}x`);

      // Cached should be significantly faster
      expect(cachedResult.avgTime).toBeLessThan(firstResult.avgTime);
    });
  });

  describe('Real-world Scenario', () => {
    it('should handle typical game scene updates (1k entities, 60 FPS budget)', async () => {
      // Simulate a typical game scene
      const root = new Entity('scene');
      const entities: Entity[] = [];

      // Create hierarchy similar to a game scene
      for (let i = 0; i < 100; i++) {
        const group = new Entity(`group_${i}`);
        root.addChild(group);
        
        for (let j = 0; j < 10; j++) {
          const entity = new Entity(`entity_${i}_${j}`);
          entity.transform.setPosition(
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100
          );
          group.addChild(entity);
          entities.push(entity);
        }
      }

      const result = await benchmark(
        'Game scene update simulation',
        () => {
          // Simulate one frame update
          entities.forEach((entity, i) => {
            // Update some transforms (as would happen in update loop)
            if (i % 10 === 0) {
              entity.transform.setPosition(
                entity.transform.localPosition.x + 0.1,
                entity.transform.localPosition.y,
                entity.transform.localPosition.z
              );
            }
            
            // Read world position (as rendering would do)
            const _ = entity.transform.worldPosition;
          });
        },
        { iterations: 60 } // Simulate 60 frames
      );

      console.log(`\n${result.name}:`);
      console.log(`  Avg time: ${result.avgTime.toFixed(2)}ms`);
      console.log(`  FPS budget (16.67ms): ${result.avgTime < 16.67 ? 'PASS' : 'FAIL'}`);
      
      // Should complete well within 16ms for 60 FPS
      expectBenchmarkFasterThan(result, 16, 'Should meet 60 FPS budget');
    });
  });
});
