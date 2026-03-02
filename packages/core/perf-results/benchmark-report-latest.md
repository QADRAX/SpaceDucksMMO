# Benchmark Report

- Run ID: 2026-03-02T18-45-08-319Z
- Generated At: 2026-03-02T18:45:09.274Z
- Working Dir: F:\Repos\SpaceDucksMMO\packages\core
- Total Benchmarks: 12
- Target FPS: 144
- Frame Budget: 6.94ms

| Benchmark | Avg (ms) | Min (ms) | Max (ms) | Ops/sec | Iterations | Suite | Test | Timestamp |
|---|---:|---:|---:|---:|---:|---|---|---|
| Create 10k entities | 6.0713 | 4.5662 | 9.2942 | 164.48 | 10 | EntityCreation.perf.test.ts | Performance: Entity Creation Basic Entity Operations should create 10,000 entities in under 100ms | 2026-03-02T18:45:08.427Z |
| Lookup 10k entities by ID | 0.1069 | 0.0781 | 0.4343 | 9124.67 | 100 | EntityCreation.perf.test.ts | Performance: Entity Creation Basic Entity Operations should handle entity lookup by ID efficiently | 2026-03-02T18:45:08.485Z |
| Add/remove 1k components | 0.4842 | 0.3466 | 1.2288 | 2051.94 | 50 | EntityCreation.perf.test.ts | Performance: Entity Creation Component Management should add/remove components efficiently | 2026-03-02T18:45:08.544Z |
| Create 1k entities with 5 components each | 4.8871 | 2.7708 | 10.9556 | 204.31 | 20 | EntityCreation.perf.test.ts | Performance: Entity Creation Component Management should handle multiple components per entity | 2026-03-02T18:45:08.732Z |
| Component lookup (10k iterations) | 0.0141 | 0.0039 | 0.9870 | 64053.29 | 100 | EntityCreation.perf.test.ts | Performance: Entity Creation Component Management should lookup components efficiently | 2026-03-02T18:45:08.756Z |
| Add 1k children to parent | 0.6811 | 0.4886 | 1.0202 | 1463.34 | 20 | EntityCreation.perf.test.ts | Performance: Entity Creation Entity Hierarchy should handle adding children efficiently | 2026-03-02T18:45:08.808Z |
| Build deep hierarchy (1k levels) | 0.5270 | 0.4737 | 0.6346 | 1887.68 | 10 | EntityCreation.perf.test.ts | Performance: Entity Creation Entity Hierarchy should handle deep hierarchy efficiently | 2026-03-02T18:45:08.858Z |
| Remove 1k children | 1.8805 | 1.8805 | 1.8805 | 528.74 | 1 | EntityCreation.perf.test.ts | Performance: Entity Creation Entity Hierarchy should handle entity removal efficiently | 2026-03-02T18:45:08.883Z |
| Create 10k entities (with memory tracking) | 13.6382 | 9.0073 | 27.1198 | 73.05 | 5 | EntityCreation.perf.test.ts | Performance: Entity Creation Memory Usage should track memory usage for entity creation | 2026-03-02T18:45:09.077Z |
| Simple entities | 0.5239 | 0.3575 | 0.9218 | 1901.44 | 50 | EntityCreation.perf.test.ts | Performance: Entity Creation Comparative Benchmarks should compare different entity creation patterns | 2026-03-02T18:45:09.131Z |
| Entities with position | 0.6691 | 0.3605 | 1.7367 | 1489.98 | 50 | EntityCreation.perf.test.ts | Performance: Entity Creation Comparative Benchmarks should compare different entity creation patterns | 2026-03-02T18:45:09.192Z |
| Entities with components | 1.0595 | 0.5764 | 3.8527 | 941.75 | 50 | EntityCreation.perf.test.ts | Performance: Entity Creation Comparative Benchmarks should compare different entity creation patterns | 2026-03-02T18:45:09.274Z |
