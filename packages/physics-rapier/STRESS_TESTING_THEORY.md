# Physics Performance Testing: Technical Details

## Overview

This document explains the **scientific approach** to stress testing the Rapier physics engine, how each scenario isolates specific performance characteristics, and how to interpret results.

## Core Concept: The Frame Budget

At **144 FPS (target)**, your physics engine has **6.94 milliseconds** to:
1. Process physics simulation
2. Handle collision detection & response
3. Handle collision events
4. Update ECS components
5. Run Lua scripts

### Performance Degradation Pattern

Physics performance typically degrades in phases:

```
Phase 1: Linear         (0-50 bodies)
├─ Each body adds ~40-80μs per frame
├─ Bottleneck: Data transfer (ECS↔Rapier)
└─ Performance: Consistent 144 FPS

Phase 2: Quadratic      (50-200 bodies)
├─ Collision checks grow O(n²) in worst case
├─ Bottleneck: Broad phase (AABB overlaps)
└─ Performance: 140-120 FPS

Phase 3: Collapse       (200+ bodies)
├─ Constraint solving dominates
├─ Bottleneck: Narrow phase (GJK/SAT) + solving
└─ Performance: <100 FPS
```

## Test Scenarios Explained

### Scenario A: Baseline (Static Entities)

**Purpose**: Establish the absolute minimum overhead of the physics engine.

**Setup**:
```
1000 entities without any physics components
```

**What it measures**:
- ECS lookup and iteration
- Physics system registration overhead
- Rapier world initialization cost

**Expected results**:
- Should be >99% stable at 144 FPS
- Frame time: 0.1-0.5ms
- If not: There's framework overhead that must be addressed

**Why this matters**:
- Baseline for comparison
- If this fails, nothing else will work
- Helps identify if Rapier initialization is the bottleneck

---

### Scenario B: 1D Linear Collisions

**Purpose**: Isolate collision **response calculation** overhead in controlled conditions.

**Concept**:
```
Time: 0ms
[●]  [●]  [●]  [●]  [●]  ...  [●]
      ↓    ↓    ↓    ↓
Time: 100ms
[●]━━[●]━━[●]━━[●]━━[●]━━━┐
                           └─ Continuous pushing
```

**Physics at work**:
- Every sphere collides with exactly 1 other (the next)
- Collisions persist (contact maintenance required)
- Linear momentum transfer through the line
- **No spatial locality** → worst case for broad phase

**What it measures**:
- Narrow phase solver efficiency (GJK when shapes touch)
- Contact constraint generation
- Impulse solver convergence
- Not about collision detection (collisions are obvious)

**Expected results**:
| Count | Avg Time | Stability | Note |
|---|---|---|---|
| 10 | 1.2ms | 99.9% | Trivial |
| 50 | 2.8ms | 98.5% | Linear scaling |
| 100 | 5.6ms | 96.2% | Approaching limit |

**Why this matters**:
- Reveals bottleneck in constraint solver
- Identifies if Rapier's sequential impulse solver has issues
- Linear pattern indicates healthy scaling up to ~100 bodies

---

### Scenario C: 3D Chaos (Falling Spheres)

**Purpose**: Realistic simulation of collision intensity.

**Concept**:
```
Setup: Random 3D distribution
  Random positions
  Random velocities (simulated by gravity)
  Falling → collisions accelerate
  Each sphere can collide with MANY others

Result: Collision count grows RAPIDLY
  10 spheres   ≈ 5-10 collisions/frame
  50 spheres   ≈ 50-100 collisions/frame
  100 spheres  ≈ 200-400 collisions/frame
  500 spheres  ≈ 5000+ collisions/frame
```

**Physics at work**:
- Broad phase stress (AABB checks grow O(n²))
- Multiple simultaneous contacts per body
- Friction and restitution effects
- Velocity updates triggering continuous re-collisions

**What it measures**:
- Broad phase efficiency (SAP, grid, or other)
- Narrow phase parallelism
- Contact management (creation/destruction rate)
- Memory allocation under stress

**Expected results**:
| Count | Collisions/Frame | Avg Time | Stability |
|---|---|---|---|
| 10 | ~8 | 1.5ms | 99.8% |
| 50 | ~60 | 3.2ms | 98.0% |
| 100 | ~250 | 6.1ms | 95.5% |
| 250 | ~1500 | 12ms | 60% |
| 500 | ~5000+ | 20ms+ | <10% |

**Why N² degradation**:
- Each new sphere can collide with ALL old spheres
- Collision count ∝ n(n-1)/2
- This drives frame time super-linearly

---

### Scenario D: Collider Type Comparison

**Purpose**: Quantify shape complexity impact.

**Shapes tested**:
```
Sphere      Box         Cylinder
◯           ☐           |
         (6 per shape)  |
GJK: Fast  GJK: Slow   GJK: Very Slow
```

**Complexity costs**:
1. **Sphere**: 1 computation (radius, distance) - **Baseline**
2. **Box**: Needs SAT or EPA for rotation - **+30-50% slower**
3. **Cylinder**: Curved surface + axis alignment - **+100-200% slower**
4. **Cone**: Apex complications - **+200-300% slower**

**Test setup**:
```typescript
// Same scenario (falling 100 bodies)
// Only change collider type
for (const shape of [Sphere, Box, Cylinder]) {
  run_falling_bodies_test(100, shape);
}
```

**Expected comparison**:
```
Shape      Avg Time   % vs Sphere
Sphere     6.1ms      100% (baseline)
Box        7.8ms      128%
Cylinder   9.2ms      151%
```

**Why this matters**:
- Immediate optimization: prefer spheres for dynamic bodies
- Boxes ok for static scenery
- Cylinders/cones only when necessary
- Shapes matter MORE than count at medium scales

---

### Scenario E: Stacked Grid (Pyramid)

**Purpose**: Stress **constraint solver** with deep dependency chains.

**Concept**:
```
Layer 3:   ☐
Layer 2: ☐ ☐ ☐
Layer 1: ☐ ☐ ☐ ☐ ☐

Contact graph: Every box touches others
              Solver must converge ALL simultaneously
```

**Physics at work**:
- Batch constraint solver (all contacts in one iteration)
- Dependency propagation (top box → all below affected)
- Stability required (stack doesn't topple except from dynamics)
- Gravity + friction + restitution interaction

**What it measures**:
- Constraint solver iterations needed
- Convergence speed under rigid stacks
- Memory for contact pairs
- Damping/numerical stability

**Expected results**:
```
Grid Size   Bodies   Contacts   Avg Time   Stability
5x5         55       ~80        2.1ms      99.5%
10x10       385      ~500       4.8ms      98.0%
15x15       1200     ~1500      8.2ms      93.0%
20x20       2660     ~3000      15ms+      <80%
```

**Why exponential degradation**:
- Body count: O(n²)
- Contact count: O(n²)  
- Solver iterations: O(sqrt(contacts))
- **Total: O(n³) or worse**

This reveals solver limitations with massive stacks.

---

### Scenario F: Mixed Load (Realistic Scene)

**Purpose**: Approximate real game scenario.

**Setup**:
```
Static bodies (30%):
├─ Terrain colliders
├─ Building geometry
├─ Fixed obstacles
└─ Non-moving scenery

Dynamic bodies (70%):
├─ Player
├─ Enemies
├─ Projectiles
├─ Interactive objects
```

**Execution**:
```
Frame 0:     Static setup, dynamic bodies fall
Frame 1-30:  Collisions, movement, physics settling
Frame 31-60: Stable state with minimal new collisions
Frame 61-120: Movement and interaction
```

**What it measures**:
- Real-world performance pattern
- Difference between initialization and steady state
- How static/dynamic ratio affects performance
- Caching/sleeping bodies effect (bodies at rest use less CPU)

**Expected results**:
| Config | Avg Time | Peak | Stability |
|---|---|---|---|
| 70 dyn + 30 static | 4.2ms | 5.8ms | 99.2% |
| 200 dyn + 100 static | 5.9ms | 7.2ms | 96.1% |
| 400 dyn + 200 static | 8.5ms | 12.1ms | 82.3% |

**Key insight**:
- Static bodies have much lower cost (Rapier caches their state)
- Frame time correlates with **dynamic bodies**, not total
- Recommendation: Use static for anything that doesn't move

---

## How to Interpret Your Results

### Step 1: Find P95 and P99

```
Scenario: Falling 100 spheres
Results:
  Avg:  6.1ms
  P95:  6.8ms  ← This is what matters
  P99:  7.2ms  ← And this

Budget: 6.94ms

Assessment: P95 > Budget = 5% frame drops
Result: BORDERLINE for 144 FPS, SAFE for 120 FPS
```

### Step 2: Check Stability

```
Stability = (Frames within 6.94ms) / Total Frames * 100

98% stable = 2 drops per 100 frames = 0.033 second every second
              Noticeable but tolerable

95% stable = 5 drops per 100 frames = 0.083 second every second
              Visible stuttering

90% stable = 10 drops per 100 frames = 0.167 second every second
              UNACCEPTABLE for games
```

### Step 3: Identify the Pattern

```
Scenario         Count    Time    Pattern
Static           1000     0.2ms   Linear (good)
Linear Collisions 100     5.6ms   Linear (good)
Falling Spheres   100     6.1ms   Quadratic (manageable)
Falling Spheres   500     20ms    Exponential (bad)
Stacked 15x15     1200    8.2ms   CUBIC (very bad)
```

### Step 4: Set Your Limits

Based on Rapier's typical performance:

```
Safe Limits @ 144 FPS:
├─ Simple collisions:       <200 dynamic bodies
├─ Chaotic collisions:      <100 dynamic bodies
├─ Stacked structures:      <50 dynamic bodies
└─ All combined in one frame: <100 dynamic bodies (conservative)

Recommendation for game:
├─ Cap dynamic bodies: 80-100
├─ Use pools and LOD (Level of Detail)
├─ Disable physics for distant bodies
├─ Consider reduced timestep for secondary physics
```

## Advanced: Profiling Deeper

If frame time is high, WHERE is the time spent?

### Broad Phase vs Narrow Phase

**Broad phase** (Quick AABB checks):
- Grows with O(n²) worst case
- Modern algorithms (BVH, SAP) → O(n log n)
- When time grows with entity count → broad phase bottleneck

**Narrow Phase** (Detailed GJK/SAT):
- Called for each overlapping pair
- Also O(n²) but with smaller constant
- When time EXPLODES with collisions → narrow phase bottleneck

```
Sample profiling:
10 bodies:   50% broad, 50% narrow
50 bodies:   60% broad, 40% narrow  ← Broad phase scaling up
100 bodies:  70% broad, 30% narrow  ← Broad phase dominates
500 bodies:  80% broad, 20% narrow  ← Massive AABB overlaps
```

**Interpretation**:
- If broad > 60%: Consider spatial partitioning, collision groups
- If narrow > 40%: Simplify shapes (use spheres, fewer boxes)

### Contact Solving Iterations

Rapier's constraint solver:
```
iterations = 4  (default)
time_per_iteration = 2-5 contacts per iteration average

High contact count:
├─ More iterations needed
├─ Time: O(bodies * contacts * iterations)
└─ Stack test: hits this hard
```

## Performance Tuning Recommendations

### Immediate (No code changes):
```
✓ Use sphere colliders for everything dynamic
✓ Keep collider counts low (<3 per body)
✓ Enable sleeping (bodies at rest are free)
✓ Use kinematic bodies for unmovable objects
```

### Short term (Algorithmic):
```
✓ Implement spatial culling (don't simulate distant bodies)
✓ Use collision groups to disable unnecessary pairs
✓ Distribute load across multiple frames
✓ Reduce contact tolerance
```

### Long term (Architecture):
```
✓ Multi-phase simulation (update per-entity physics on timer)
✓ Parallel constraint solving
✓ GPU simulation (for many small bodies)
✓ Switch to simpler physics for distant bodies
```

## Reference: Rapier Performance Characteristics

Based on official benchmarks and community reports:

```
Broad Phase:
├─ Empty world:        <0.1ms
├─ 100 dynamic bodies: ~1.5ms
├─ 1000 dynamic:       ~15ms
└─ Algorithm: BVH + cached

Narrow Phase (per contact):
├─ Sphere-sphere:      ~1μs (microsecond!)
├─ Box-box:            ~3μs
├─ Sphere-box:         ~2μs
└─ Cylinder-anything:  ~5μs

Constraint Solving (per body):
├─ 4 default iterations
├─ 10-20 velocity updates per iteration
├─ Time ∝ (bodies * contacts)
└─ Typical: 200-300 bodies·contacts/ms
```

## Conclusion

The stress tests give you:
1. **Absolute limits** of the physics engine
2. **Bottleneck identification** (broad vs narrow vs solving)
3. **Real-world performance projection** for your game
4. **Optimization targets** (where to focus effort)

Run the tests, analyze the curves, and set conservative limits. A game at 95% stability is still visibly stuttering. Aim for 99%+ at your expected load, with 2x safety margin.
