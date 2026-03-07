# Benchmark Report

- Run ID: 2026-03-07T00-31-00-504Z
- Generated At: 2026-03-07T00:31:31.091Z
- Working Dir: F:\Repos\SpaceDucksMMO\packages\core
- Total Benchmarks: 12
- Target FPS: 144
- Frame Budget: 6.94ms

| Benchmark | Avg (ms) | Min (ms) | Max (ms) | Ops/sec | Iterations | Suite | Test | Timestamp |
|---|---:|---:|---:|---:|---:|---|---|---|
| Compile 100 simple scripts | 666.3502 | 526.5907 | 1150.5994 | 1.50 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should compile 100 simple scripts efficiently | 2026-03-07T00:31:09.611Z |
| Minimal scripts (100) | 368.2490 | 335.9533 | 420.8449 | 2.72 | 5 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should handle compilation of scripts with different complexities | 2026-03-07T00:31:15.353Z |
| Simple scripts (100) | 335.4220 | 330.6171 | 346.6802 | 2.98 | 5 | ScriptExecution.perf.test.ts | Performance: Script System Script Compilation should handle compilation of scripts with different complexities | 2026-03-07T00:31:21.131Z |
| Execute 100 script updates | 5.5919 | 5.2957 | 6.1520 | 178.74 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Execution should execute 100 update hooks within frame budget (144 FPS target) | 2026-03-07T00:31:21.899Z |
| Execute 100 scripts with Transform updates | 0.0254 | 0.0227 | 0.0593 | 37759.60 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Execution should test script execution with Transform access | 2026-03-07T00:31:22.412Z |
| Lifecycle: earlyUpdate only | 9.4909 | 8.8537 | 11.7445 | 105.33 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T00:31:23.717Z |
| Lifecycle: update only | 9.1414 | 8.6686 | 10.9583 | 109.36 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T00:31:24.359Z |
| Lifecycle: lateUpdate only | 9.2230 | 8.6744 | 11.2019 | 108.39 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T00:31:25.006Z |
| Full lifecycle (early + update + late) | 28.1539 | 26.7169 | 34.0873 | 35.51 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Script Lifecycle should test full lifecycle performance | 2026-03-07T00:31:26.986Z |
| No-op scripts | 75.8754 | 68.2811 | 84.8563 | 13.18 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script System Overhead should measure Lua bridge overhead | 2026-03-07T00:31:28.514Z |
| Bridge-heavy scripts | 105.4138 | 96.2067 | 116.5703 | 9.49 | 10 | ScriptExecution.perf.test.ts | Performance: Script System Script System Overhead should measure Lua bridge overhead | 2026-03-07T00:31:30.627Z |
| Realistic game frame (100 entities) | 0.1213 | 0.0744 | 1.4449 | 8158.38 | 60 | ScriptExecution.perf.test.ts | Performance: Script System Real-world Scenario should handle realistic game scenario (100 entities, mixed scripts) at 144 FPS target | 2026-03-07T00:31:31.090Z |
