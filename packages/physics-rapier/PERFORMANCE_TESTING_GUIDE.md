# Physics Performance Testing Guide

## Overview

Complete stress testing framework for Rapier physics engine to identify performance thresholds at **144 FPS** (~6.94ms frame budget).

## Running Tests

### Run all performance tests
```bash
npm run test:performance
```

### Run only stress tests
```bash
npm run test:stress
```

### Run with detailed output
```bash
npm run test:performance -- --verbose
```

## Test Scenarios

### 1. **Baseline: Static Entities** (No Physics)
- **Purpose**: Establish engine overhead
- **Entities**: 1,000 static objects
- **Expected**: >99% stability

### 2. **Scenario A: 1D Collision (Linear Push)**
Linear array of spheres pushing each other in 1D space.
- **Variants**: 10, 50, 100 spheres
- **Measures**: Constant collision response overhead
- **Expected degradation**: Linear with entity count

```
[O] -> [O] -> [O] -> [O]   (each colliding with next)
```

### 3. **Scenario B: 3D Chaos (Falling Spheres)**
Most realistic stress test - spheres falling and colliding randomly.
- **Variants**: 10, 50, 100, 250, 500 spheres
- **Measures**: Real-world collision complexity
- **Expected degradation**: Non-linear (collision count grows quickly)

### 4. **Scenario C: Collider Type Comparison**
Identifies which collision shapes have highest overhead.
- **Types**: Spheres vs Boxes vs Cylinders
- **Count**: 50-100 bodies
- **Insight**: Which shapes to avoid at scale

### 5. **Scenario D: Stacked Grid (Pyramid)**
Tests rigid body stability with cascading collisions.
- **Variants**: 10x10, 15x15 stacked boxes
- **Measures**: Compound collision handling
- **Expected**: Exponential degradation with stack height

### 6. **Scenario E: Mixed Load**
Realistic blend of dynamic/static bodies.
- **Variants**: 70 dynamic + 30 static, 200 dynamic + 100 static
- **Measures**: Real-world scene complexity

## Understanding Results

### Frame Time Metrics

```
Avg:     Average frame time across all frames
P95:     95th percentile (worst 5% of frames)
P99:     99th percentile (worst 1% of frames)
StdDev:  Consistency (lower = more stable)
```

### Stability Percentage

- **≥99%**: PASS - Reliable at 144 FPS
- **≥95%**: WARNING - Occasional frame drops
- **<95%**: FAIL - Inconsistent performance

### Frame Budget

At **144 FPS**: Frame budget = **6.94ms**

- ✓ < 6.94ms: Within budget
- ⚠ 6.94-7.5ms: Marginal (minor drops)
- ✗ > 7.5ms: Exceeding (significant drops)

## Output Files

Tests generate reports in `perf-results/stress/`:

### JSON Report
```
collision-stress-2026-03-02T12-34-56.json
```
Contains full metrics for comparison and graphing.

### CSV Report
```
collision-stress-2026-03-02T12-34-56.csv
```
Import to Excel/Sheets for analysis and charting.

## Analysis Tips

### 1. Find the Threshold
Look for the point where **stability drops below 95%**:

| Entities | Stability | Status |
|---|---|---|
| 50 | 98.5% | ✓ Safe |
| 100 | 97.2% | ✓ Safe |
| **250** | **92.1%** | **⚠ Risky** |
| 500 | 78.3% | ✗ Fail |

**Recommendation**: Cap at 100 entities for consistent 144 FPS.

### 2. Identify Bottlenecks
Compare scenarios to find the worst case:

```
Falling Spheres (100):   avg 5.2ms   98% stable
Stacked Boxes (10x10):   avg 8.1ms   87% stable  <-- Bottleneck
Mixed Load (70+30):      avg 6.1ms   96% stable
```

**Finding**: Stacked boxes create cascading collisions.

### 3. Track Regression
Compare before/after performance changes:

```bash
# Run baseline
npm run test:performance > baseline.txt

# Make optimization
# ...

# Compare new results
npm run test:performance > optimized.txt

# diff baseline.txt optimized.txt
```

## Optimization Strategies

### If you're hitting performance limits:

1. **Reduce Collision Checks**
   - Use spatial partitioning (already in Rapier)
   - Define collision groups/masks
   - Disable collisions for non-gameplay bodies

2. **Simplify Shapes**
   - Replace cylinders/cones with spheres where possible
   - Use smaller collider counts (compound shapes)
   - Prefer spheres for dynamic bodies

3. **Tune Physical Parameters**
   - Increase damping to reduce movement
   - Reduce restitution (less bouncing = fewer recalculations)
   - Use kinematic bodies where dynamic not needed

4. **Distribute Load**
   - Split into multiple physics substeps
   - Use different timesteps for different entity groups
   - Consider culling distant bodies

5. **Profile Deeper**
   - Monitor which phase takes time:
     - Broad phase (AABB checks)
     - Narrow phase (GJK/SAT)
     - Constraint solving
     - Contact generation

## Example Performance Curve

Based on typical Rapier benchmarks:

```
FPS Performance vs Entity Count (Dynamic Spheres)

144 FPS |●
140 FPS |
130 FPS |    ●●
120 FPS |       
100 FPS |          ●
80 FPS  |             ●
60 FPS  |                
40 FPS  |                   ●
20 FPS  |                      ●
        |________________________
        0   50   100  250  500  1000+
                Entity Count
```

**Knee point** (where degradation accelerates): ~100-150 entities with collisions.

## Advanced Usage

### Run specific scenario
```bash
# Just falling spheres
npm run test:performance -- --testNamePattern="Falling Spheres"

# Just type comparison
npm run test:performance -- --testNamePattern="Collider Type"
```

### Increase memory tracking
```bash
DUCK_TRACK_MEMORY=1 npm run test:performance
```

### Adjust target FPS (for different platforms)
```bash
DUCK_TARGET_FPS=60 npm run test:performance
```

## Troubleshooting

### Tests hang or timeout
- Reduce number of frames in test (`FRAMES` variable)
- Check Rapier initialization completes
- Use `--detectOpenHandles --forceExit` flags

### Memory grows continuously
- Entities not being properly disposed
- Collision event history accumulating
- Check scaffold.dispose() is called

### Inconsistent results between runs
- Higher variance (StdDev) indicates system contention
- Close background applications
- Use seeded random (already implemented)
- Run multiple times, average the results

## For Framework Developers

### Key Files
- `PhysicsPerformanceUtils.ts` - Metrics & reporting
- `RapierPhysics.stress.test.ts` - Scenario implementations
- `RapierSceneTestScaffold` - Test infrastructure

### Adding New Scenarios

```typescript
async function runMyScenario(count: number, results: StressTestResult[]): Promise<void> {
  const scaffold = await RapierSceneTestScaffold.create({
    timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
  });

  try {
    const tester = new PhysicsStressTester();
    const FRAMES = 120; // Adjust as needed

    // Create your scenario...
    // ...

    // Measure frames
    for (let frame = 0; frame < FRAMES; frame++) {
      const frameTime = measurePhysicsFrame(scaffold, 1000/60);
      const collisionCount = getCollisionEventCount(scaffold);
      tester.recordFrame(frameTime, collisionCount);
    }

    const result = tester.computeResults(`MyScenario-${count}`, count, count);
    results.push(result);
  } finally {
    scaffold.dispose();
  }
}
```

Then add test case:
```typescript
it("should handle my scenario at scale X", async () => {
  await runMyScenario(X, ALL_RESULTS);
});
```

## Reference: 144 FPS Budget Breakdown

```
Total frame time: 6.944ms

Typical allocation (without rendering):
├─ Physics simulation:    1.5-2.5ms  (21-36%)
├─ Collision detection:   0.5-1.5ms  (7-22%)
├─ ECS updates:           0.5-1.0ms  (7-14%)
├─ Script execution:      0.5-2.0ms  (7-29%)
└─ Overhead:              0.5-1.0ms  (7-14%)
```

Much headroom available for rendering with proper physics optimization!
