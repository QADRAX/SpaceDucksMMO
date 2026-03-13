# Physics Performance Testing - Quick Start

## 5 Minute Setup

### 1. Install dependencies (if needed)
```bash
cd packages/physics-rapier
npm install
npm run build
```

### 2. Run the stress tests
```bash
npm run test:stress
```

This will:
- ✓ Run all physics stress scenarios
- ✓ Measure frame times for each
- ✓ Generate reports in `perf-results/stress/`
- ✓ Show results in console

### 3. Analyze results
```bash
npm run perf:analyze:latest
```

## Expected Output

```
====================================================================================================
 PHYSICS PERFORMANCE ANALYSIS
====================================================================================================

SCENARIO SUMMARY:
Scenario           │Entities│Colliders│Avg    │P95    │P99    │Stability│Est. FPS  │Status
───────────────────┼────────┼──────────┼───────┼───────┼───────┼──────────┼──────────┼────────
Static(1k)         │1000    │0        │0.213ms│0.421ms│0.512ms│99.2%    │7411.3 FPS│✓
Linear-10spheres   │10      │10       │1.245ms│1.352ms│1.456ms│99.8%    │803.2 FPS │✓
Linear-50spheres   │50      │50       │2.856ms│3.124ms│3.412ms│98.5%    │350.1 FPS │✓
Linear-100spheres  │100     │100      │5.642ms│6.234ms│6.892ms│94.2%    │177.2 FPS │⚠
Falling-10spheres  │10      │10       │1.523ms│1.684ms│1.821ms│99.5%    │657.0 FPS │✓
...
```

## What Does Each Test Do?

| Test | What | How Many | Why |
|------|------|----------|-----|
| **Static(1k)** | 1000 non-physics entities | 1 scenario | Baseline overhead |
| **Linear** | Spheres pushing in a line | 10, 50, 100 | Simple collision stress |
| **Falling** | Spheres falling & colliding | 10-500 | Realistic chaos |
| **Comparison** | Sphere vs Box colliders | 50, 100 | Shape performance impact |
| **Stacked** | Blocks stacked in pyramid | 10×10, 15×15 | Deep constraint solving |
| **Mixed** | Static + Dynamic bodies | Various combos | Real game scenarios |

## Reading the Results

### Safety Levels

```
✓ GREEN:  ≥99% stability  → Safe at 144 FPS
⚠ YELLOW: 95-99% stability → Risky, occasional drops
✗ RED:    <95% stability   → Unplayable, too many drops
```

### The Numbers

- **Avg** = Average frame time (aim for <6.94ms at 144 FPS)
- **P95** = 95th percentile (what 95% of frames are faster than)
- **P99** = 99th percentile (what 99% of frames are faster than)
- **Stability** = % of frames within budget

## Find Your Limits

Look at the "Falling" scenarios - they're most realistic:

```
Falling-10spheres:   ✓ 99.5% → SAFE
Falling-50spheres:   ✓ 98.0% → SAFE
Falling-100spheres:  ⚠ 95.5% → MARGINAL
Falling-250spheres:  ✗ 60.0% → FAIL
```

**Recommendation**: Cap at ~100 dynamic bodies for 144 FPS.

## Common Questions

### "My results are slower than expected"
Possible causes:
1. System is busy (close other apps)
2. Testing in Debug mode (should be Release)
3. Rapier initialization overhead (run again, first run is slower)

### "Can I tune this for my game?"
Yes! See `PERFORMANCE_TESTING_GUIDE.md` for:
- How to add custom scenarios
- How to optimize based on results
- How to profile deeper

### "Why does Scenario X take so long?"
- **Linear-100**: Contact solver iterating 100+ times
- **Falling-500**: Broad phase checking 500² = 250,000 AABB pairs
- **Stacked-15x15**: Constraint dependency chains

See `STRESS_TESTING_THEORY.md` for deep dive.

### "Should I run on CI/CD?"
```bash
# Yes! Add to test pipeline:
npm run test:stress -- --bail  # Stop on first failure

# Set baselines:
npm run test:stress > baseline.txt

# Compare later:
npm run test:stress > latest.txt
diff baseline.txt latest.txt    # Flag regressions
```

## Advanced: Compare Test Runs

```bash
# Run test 1
npm run test:stress
# → generates collision-stress-2026-03-02T...json

# Run test 2 (after optimization)
npm run test:stress
# → generates new collision-stress-2026-03-02T...json

# Compare
npm run perf:compare collision-stress-OLD.json collision-stress-NEW.json
```

Output shows:
- ↑ Performance degraded
- ↓ Performance improved
- → No change

## Customize Test Load

Edit `RapierPhysics.stress.test.ts` to change:

```typescript
// Change entity counts
it("should handle 100 falling spheres", async () => {
  await runFallingSpheresTest(100, ALL_RESULTS);  // ← Change this
});

// Change frame count (test duration)
const FRAMES = 180;  // ← Change this (=3 seconds @ 60fps)

// Add new scenario
it("custom test", async () => {
  // Your test here
});
```

Then rebuild and run:
```bash
npm run build
npm run test:stress
```

## Integration with Monorepo

From workspace root:
```bash
npm run --workspace=@duckengine/physics-rapier test:stress
npm run --workspace=@duckengine/physics-rapier perf:analyze:latest
```

## Performance Targets

For reference, typical Rapier performance on modern hardware:

| Scenario | Threshold for 144 FPS |
|----------|---|
| Simple gravity falls | ~200 bodies |
| Chaotic collisions | ~100 bodies |
| Stacked structures | ~50 bodies |
| Mixed realistic scene | ~80 bodies |

**Conservative recommendation for games**: 50-80 dynamic bodies max.

## Next Steps

1. ✓ Run `npm run test:stress`
2. ✓ Analyze with `npm run perf:analyze:latest`
3. ✓ Read results against your limits
4. ✓ See `PERFORMANCE_TESTING_GUIDE.md` for deeper analysis
5. ✓ See `STRESS_TESTING_THEORY.md` for academic understanding

## Support

- **Questions?** See [PERFORMANCE_TESTING_GUIDE.md](./PERFORMANCE_TESTING_GUIDE.md)
- **Theory?** See [STRESS_TESTING_THEORY.md](./STRESS_TESTING_THEORY.md)
- **Bug?** Check [README.md](./README.md#integration-test-framework)
