/**
 * Performance tests for Entity creation and management
 */

import { Entity } from '../../domain/ecs/core/Entity';
import { NameComponent } from '../../domain/ecs/components/NameComponent';
import { BoxColliderComponent } from '../../domain/ecs/components/physics/BoxColliderComponent';
import { RigidBodyComponent } from '../../domain/ecs/components/physics/RigidBodyComponent';
import {
  benchmark,
  compareBenchmarks,
  printBenchmarkResults,
  expectBenchmarkFasterThan,
  expectMinOpsPerSecond,
  BenchmarkResult
} from './BenchmarkUtils';

describe('Performance: Entity Creation', () => {
  describe('Basic Entity Operations', () => {
    it('should create 10,000 entities in under 100ms', async () => {
      const result = await benchmark(
        'Create 10k entities',
        () => {
          const entities: Entity[] = [];
          for (let i = 0; i < 10_000; i++) {
            const entity = new Entity(`entity_${i}`);
            entity.transform.setPosition(i, 0, 0);
            entities.push(entity);
          }
        },
        { iterations: 10, warmupIterations: 2 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg (${result.opsPerSecond.toFixed(0)} ops/sec)`);
      
      expectBenchmarkFasterThan(result, 100, 'Entity creation should be fast');
    });

    it('should handle entity lookup by ID efficiently', async () => {
      // Setup: Create entity map
      const entityMap = new Map<string, Entity>();
      for (let i = 0; i < 10_000; i++) {
        const entity = new Entity(`entity_${i}`);
        entityMap.set(entity.id, entity);
      }

      const result = await benchmark(
        'Lookup 10k entities by ID',
        () => {
          for (let i = 0; i < 10_000; i += 10) {
            const entity = entityMap.get(`entity_${i}`);
            if (!entity) throw new Error('Entity not found');
          }
        },
        { iterations: 100 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(4)}ms avg`);
      expectBenchmarkFasterThan(result, 1, 'Entity lookup should be very fast');
    });
  });

  describe('Component Management', () => {
    it('should add/remove components efficiently', async () => {
      const entity = new Entity('test');

      const result = await benchmark(
        'Add/remove 1k components',
        () => {
          for (let i = 0; i < 1_000; i++) {
            const name = new NameComponent();
            name.value = `Component ${i}`;
            entity.addComponent(name);
            entity.removeComponent('name');
          }
        },
        { iterations: 50 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 50, 'Component add/remove should be fast');
    });

    it('should handle multiple components per entity', async () => {
      const result = await benchmark(
        'Create 1k entities with 5 components each',
        () => {
          const entities: Entity[] = [];
          for (let i = 0; i < 1_000; i++) {
            const entity = new Entity(`entity_${i}`);
            
            const name = new NameComponent();
            name.value = `Entity ${i}`;
            entity.addComponent(name);
            
            const boxCollider = new BoxColliderComponent();
            boxCollider.halfExtents.x = 1;
            boxCollider.halfExtents.y = 1;
            boxCollider.halfExtents.z = 1;
            entity.addComponent(boxCollider);
            
            const rigidBody = new RigidBodyComponent();
            entity.addComponent(rigidBody);
            
            entities.push(entity);
          }
        },
        { iterations: 20 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 100, 'Multi-component entities should be reasonably fast');
    });

    it('should lookup components efficiently', async () => {
      const entity = new Entity('test');
      entity.addComponent(new NameComponent());
      entity.addComponent(new BoxColliderComponent());
      entity.addComponent(new RigidBodyComponent());

      const result = await benchmark(
        'Component lookup (10k iterations)',
        () => {
          for (let i = 0; i < 10_000; i++) {
            const name = entity.getComponent('name');
            const collider = entity.getComponent('boxCollider');
            const rb = entity.getComponent('rigidBody');
          }
        },
        { iterations: 100 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(4)}ms avg`);
      expectBenchmarkFasterThan(result, 10, 'Component lookup should be very fast');
    });
  });

  describe('Entity Hierarchy', () => {
    it('should handle adding children efficiently', async () => {
      const result = await benchmark(
        'Add 1k children to parent',
        () => {
          const parent = new Entity('parent');
          for (let i = 0; i < 1_000; i++) {
            const child = new Entity(`child_${i}`);
            parent.addChild(child);
          }
        },
        { iterations: 20 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 50, 'Adding children should be fast');
    });

    it('should handle deep hierarchy efficiently', async () => {
      const result = await benchmark(
        'Build deep hierarchy (1k levels)',
        () => {
          let current = new Entity('root');
          for (let i = 0; i < 1_000; i++) {
            const child = new Entity(`child_${i}`);
            current.addChild(child);
            current = child;
          }
        },
        { iterations: 10 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 50, 'Deep hierarchy building should be reasonably fast');
    });

    it('should handle entity removal efficiently', async () => {
      // Setup
      const parent = new Entity('parent');
      const children: Entity[] = [];
      for (let i = 0; i < 1_000; i++) {
        const child = new Entity(`child_${i}`);
        parent.addChild(child);
        children.push(child);
      }

      const result = await benchmark(
        'Remove 1k children',
        () => {
          children.forEach(child => parent.removeChild(child.id));
        },
        { iterations: 1, warmupIterations: 0 }
      );

      console.log(`\n${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      expectBenchmarkFasterThan(result, 50, 'Removing children should be fast');
    });
  });

  describe('Memory Usage', () => {
    it('should track memory usage for entity creation', async () => {
      const result = await benchmark(
        'Create 10k entities (with memory tracking)',
        () => {
          const entities: Entity[] = [];
          for (let i = 0; i < 10_000; i++) {
            const entity = new Entity(`entity_${i}`);
            entity.addComponent(new NameComponent());
            entities.push(entity);
          }
        },
        { iterations: 5, trackMemory: true }
      );

      console.log(`\n${result.name}:`);
      console.log(`  Avg time: ${result.avgTime.toFixed(2)}ms`);
      if (result.memoryUsed !== undefined) {
        const memMB = result.memoryUsed / 1024 / 1024;
        console.log(`  Memory: ${memMB.toFixed(2)}MB`);
        console.log(`  Bytes per entity: ${(result.memoryUsed / 10_000).toFixed(0)}`);
      }
    });
  });

  describe('Comparative Benchmarks', () => {
    it('should compare different entity creation patterns', async () => {
      const results = await compareBenchmarks([
        {
          name: 'Simple entities',
          fn: () => {
            for (let i = 0; i < 1_000; i++) {
              new Entity(`entity_${i}`);
            }
          }
        },
        {
          name: 'Entities with position',
          fn: () => {
            for (let i = 0; i < 1_000; i++) {
              const e = new Entity(`entity_${i}`);
              e.transform.setPosition(i, i, i);
            }
          }
        },
        {
          name: 'Entities with components',
          fn: () => {
            for (let i = 0; i < 1_000; i++) {
              const e = new Entity(`entity_${i}`);
              e.addComponent(new NameComponent());
            }
          }
        }
      ], { iterations: 50 });

      printBenchmarkResults(results);

      // Verify all complete within reasonable time
      results.forEach(r => {
        expect(r.avgTime).toBeLessThan(50);
      });
    });
  });
});
