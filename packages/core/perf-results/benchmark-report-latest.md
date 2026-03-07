# Benchmark Report

- Run ID: 2026-03-07T01-13-07-803Z
- Generated At: 2026-03-07T01:13:38.219Z
- Working Dir: F:\Repos\SpaceDucksMMO\packages\core
- Total Benchmarks: 12
- Target FPS: 144
- Frame Budget: 6.94ms

| Benchmark | Avg (ms) | Min (ms) | Max (ms) | Ops/sec | Iterations | Suite | Test | Timestamp |
|---|---:|---:|---:|---:|---:|---|---|---|
| Compile 100 simple scripts | 641.3185 | 529.8122 | 885.4777 | 1.56 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should compile 100 simple scripts efficiently | 2026-03-07T01:13:16.329Z |
| Minimal scripts (100) | 367.8565 | 343.2996 | 382.9484 | 2.72 | 5 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should handle compilation of scripts with different complexities | 2026-03-07T01:13:22.087Z |
| Simple scripts (100) | 357.8716 | 339.3580 | 382.9324 | 2.79 | 5 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should handle compilation of scripts with different complexities | 2026-03-07T01:13:28.112Z |
| Execute 100 script updates | 5.4672 | 5.2374 | 6.0757 | 182.83 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Execution should execute 100 update hooks within frame budget (144 FPS target) | 2026-03-07T01:13:28.873Z |
| Execute 100 scripts with Transform updates | 0.0256 | 0.0227 | 0.0486 | 37364.55 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Execution should test script execution with Transform access | 2026-03-07T01:13:29.334Z |
| Lifecycle: earlyUpdate only | 9.6224 | 8.8847 | 11.5206 | 103.89 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T01:13:30.651Z |
| Lifecycle: update only | 9.0862 | 8.5219 | 10.9954 | 110.02 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T01:13:31.290Z |
| Lifecycle: lateUpdate only | 9.1398 | 8.6784 | 10.6341 | 109.38 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T01:13:31.931Z |
| Full lifecycle (early + update + late) | 28.3284 | 26.7227 | 37.4549 | 35.30 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T01:13:33.907Z |
| No-op scripts | 79.2336 | 69.0879 | 95.0550 | 12.62 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script System Overhead should measure Lua bridge overhead | 2026-03-07T01:13:35.558Z |
| Bridge-heavy scripts | 110.1132 | 99.0172 | 129.0737 | 9.08 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script System Overhead should measure Lua bridge overhead | 2026-03-07T01:13:37.766Z |
| Realistic game frame (100 entities) | 0.0958 | 0.0723 | 0.1991 | 10186.93 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Real-world Scenario should handle realistic game scenario (100 entities, mixed scripts) at 144 FPS target | 2026-03-07T01:13:38.219Z |
