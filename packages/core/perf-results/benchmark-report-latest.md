# Benchmark Report

- Run ID: 2026-03-07T01-38-22-339Z
- Generated At: 2026-03-07T01:38:52.237Z
- Working Dir: F:\Repos\SpaceDucksMMO\packages\core
- Total Benchmarks: 12
- Target FPS: 144
- Frame Budget: 6.94ms

| Benchmark | Avg (ms) | Min (ms) | Max (ms) | Ops/sec | Iterations | Suite | Test | Timestamp |
|---|---:|---:|---:|---:|---:|---|---|---|
| Compile 100 simple scripts | 602.4395 | 490.1813 | 899.2609 | 1.66 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should compile 100 simple scripts efficiently | 2026-03-07T01:38:30.560Z |
| Minimal scripts (100) | 383.5352 | 352.1752 | 414.5261 | 2.61 | 5 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should handle compilation of scripts with different complexities | 2026-03-07T01:38:36.228Z |
| Simple scripts (100) | 330.6910 | 320.9751 | 346.6255 | 3.02 | 5 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should handle compilation of scripts with different complexities | 2026-03-07T01:38:42.185Z |
| Execute 100 script updates | 5.3651 | 4.9501 | 5.7960 | 186.30 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Execution should execute 100 update hooks within frame budget (144 FPS target) | 2026-03-07T01:38:42.921Z |
| Execute 100 scripts with Transform updates | 0.0246 | 0.0214 | 0.0699 | 38719.67 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Execution should test script execution with Transform access | 2026-03-07T01:38:43.355Z |
| Lifecycle: earlyUpdate only | 9.4207 | 8.6813 | 11.8587 | 106.12 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T01:38:44.647Z |
| Lifecycle: update only | 9.2416 | 8.4777 | 12.7897 | 108.17 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T01:38:45.294Z |
| Lifecycle: lateUpdate only | 9.2886 | 8.6657 | 10.8694 | 107.62 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T01:38:45.943Z |
| Full lifecycle (early + update + late) | 29.0925 | 26.3616 | 41.1180 | 34.37 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T01:38:47.966Z |
| No-op scripts | 77.9964 | 66.9792 | 93.0988 | 12.82 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script System Overhead should measure Lua bridge overhead | 2026-03-07T01:38:49.616Z |
| Bridge-heavy scripts | 107.0617 | 93.7674 | 125.8449 | 9.34 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script System Overhead should measure Lua bridge overhead | 2026-03-07T01:38:51.775Z |
| Realistic game frame (100 entities) | 0.1140 | 0.0755 | 1.0997 | 8677.67 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Real-world Scenario should handle realistic game scenario (100 entities, mixed scripts) at 144 FPS target | 2026-03-07T01:38:52.237Z |
