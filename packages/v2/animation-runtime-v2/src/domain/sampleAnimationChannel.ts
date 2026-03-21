import type { AnimationChannelTrack } from '@duckengine/core-v2';
import type { QuatLike, Vec3Like } from '@duckengine/core-v2';
import { quatNormalize } from '@duckengine/core-v2';

/** Result of sampling one channel at a time. */
export type SampledChannel =
  | { readonly path: 'translation' | 'scale'; readonly v: Vec3Like }
  | { readonly path: 'rotation'; readonly q: QuatLike }
  | { readonly path: 'weights'; readonly weights: readonly number[] };

function findTimeSpan(
  times: readonly number[],
  t: number,
): { readonly i0: number; readonly i1: number; readonly u: number } {
  if (times.length === 0) return { i0: 0, i1: 0, u: 0 };
  if (t <= times[0]!) return { i0: 0, i1: 0, u: 0 };
  const last = times.length - 1;
  if (t >= times[last]!) return { i0: last, i1: last, u: 0 };
  let lo = 0;
  let hi = last;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (times[mid]! <= t) lo = mid;
    else hi = mid;
  }
  const i0 = lo;
  const i1 = lo + 1;
  const dt = times[i1]! - times[i0]!;
  const u = dt > 0 ? (t - times[i0]!) / dt : 0;
  return { i0, i1, u };
}

function findStepIndex(times: readonly number[], t: number): number {
  if (times.length === 0) return 0;
  let idx = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i]! <= t) idx = i;
    else break;
  }
  return idx;
}

function quatSlerp(a: QuatLike, b: QuatLike, t: number): QuatLike {
  let ax = a.x;
  let ay = a.y;
  let az = a.z;
  let aw = a.w;
  let bx = b.x;
  let by = b.y;
  let bz = b.z;
  let bw = b.w;
  let dot = ax * bx + ay * by + az * bz + aw * bw;
  if (dot < 0) {
    dot = -dot;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  if (dot > 0.9995) {
    return quatNormalize({
      x: ax + t * (bx - ax),
      y: ay + t * (by - ay),
      z: az + t * (bz - az),
      w: aw + t * (bw - aw),
    });
  }
  const theta0 = Math.acos(Math.min(1, Math.max(-1, dot)));
  const theta = theta0 * t;
  const sin0 = Math.sin(theta0);
  const s0 = Math.cos(theta) - dot * (Math.sin(theta) / sin0);
  const s1 = Math.sin(theta) / sin0;
  return quatNormalize({
    x: s0 * ax + s1 * bx,
    y: s0 * ay + s1 * by,
    z: s0 * az + s1 * bz,
    w: s0 * aw + s1 * bw,
  });
}

function vec3AtLinear(values: readonly number[], keyIndex: number): Vec3Like {
  const b = keyIndex * 3;
  return { x: values[b]!, y: values[b + 1]!, z: values[b + 2]! };
}

/** glTF CUBICSPLINE vec3: 9 floats per key (in-tangent, value, out-tangent). */
function vec3ValueAtCubicspline(values: readonly number[], keyIndex: number): Vec3Like {
  const b = keyIndex * 9;
  return { x: values[b + 3]!, y: values[b + 4]!, z: values[b + 5]! };
}

function quatAtLinear(values: readonly number[], keyIndex: number): QuatLike {
  const b = keyIndex * 4;
  return quatNormalize({
    x: values[b]!,
    y: values[b + 1]!,
    z: values[b + 2]!,
    w: values[b + 3]!,
  });
}

/** glTF CUBICSPLINE rotation: 12 floats per key (in,value,out per component ×4). */
function quatValueAtCubicspline(values: readonly number[], keyIndex: number): QuatLike {
  const b = keyIndex * 12;
  return quatNormalize({
    x: values[b + 1]!,
    y: values[b + 4]!,
    z: values[b + 7]!,
    w: values[b + 10]!,
  });
}

/**
 * Samples one animation channel at `time` (seconds, already wrapped/clamped to clip duration).
 */
export function sampleAnimationChannelAtTime(
  channel: AnimationChannelTrack,
  time: number,
): SampledChannel | null {
  const { times, values, path, interpolation } = channel;
  if (times.length === 0) return null;

  if (path === 'translation' || path === 'scale') {
    if (interpolation === 'linear') {
      if (values.length < times.length * 3) return null;
      const { i0, i1, u } = findTimeSpan(times, time);
      const a = vec3AtLinear(values, i0);
      const b = vec3AtLinear(values, i1);
      return {
        path,
        v: {
          x: a.x + (b.x - a.x) * u,
          y: a.y + (b.y - a.y) * u,
          z: a.z + (b.z - a.z) * u,
        },
      };
    }
    if (interpolation === 'step') {
      if (values.length < times.length * 3) return null;
      const k = findStepIndex(times, time);
      return { path, v: vec3AtLinear(values, k) };
    }
    if (interpolation === 'cubicSpline') {
      if (values.length < times.length * 9) return null;
      const { i0, i1, u } = findTimeSpan(times, time);
      const a = vec3ValueAtCubicspline(values, i0);
      const b = vec3ValueAtCubicspline(values, i1);
      return {
        path,
        v: {
          x: a.x + (b.x - a.x) * u,
          y: a.y + (b.y - a.y) * u,
          z: a.z + (b.z - a.z) * u,
        },
      };
    }
    return null;
  }

  if (path === 'rotation') {
    if (interpolation === 'linear') {
      if (values.length < times.length * 4) return null;
      const { i0, i1, u } = findTimeSpan(times, time);
      return {
        path: 'rotation',
        q: quatSlerp(quatAtLinear(values, i0), quatAtLinear(values, i1), u),
      };
    }
    if (interpolation === 'step') {
      if (values.length < times.length * 4) return null;
      const k = findStepIndex(times, time);
      return { path: 'rotation', q: quatAtLinear(values, k) };
    }
    if (interpolation === 'cubicSpline') {
      if (values.length < times.length * 12) return null;
      const { i0, i1, u } = findTimeSpan(times, time);
      return {
        path: 'rotation',
        q: quatSlerp(
          quatValueAtCubicspline(values, i0),
          quatValueAtCubicspline(values, i1),
          u,
        ),
      };
    }
    return null;
  }

  if (path === 'weights') {
    const n = times.length;
    if (n === 0 || values.length % n !== 0) return null;
    const perKey = values.length / n;
    if (interpolation === 'step') {
      const k = findStepIndex(times, time);
      const o = k * perKey;
      return { path: 'weights', weights: values.slice(o, o + perKey) };
    }
    if (interpolation === 'linear' || interpolation === 'cubicSpline') {
      const { i0, i1, u } = findTimeSpan(times, time);
      const o0 = i0 * perKey;
      const o1 = i1 * perKey;
      const out: number[] = new Array(perKey);
      for (let i = 0; i < perKey; i++) {
        const a = values[o0 + i]!;
        const b = values[o1 + i]!;
        out[i] = a + (b - a) * u;
      }
      return { path: 'weights', weights: out };
    }
    return null;
  }

  return null;
}
