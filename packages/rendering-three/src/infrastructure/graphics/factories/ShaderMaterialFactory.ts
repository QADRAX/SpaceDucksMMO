// @ts-ignore
import * as THREE from 'three/webgpu';
// @ts-ignore
import { glslFn, wgslFn, uv, time, uniform, texture, color, float, normalLocal, normalView, positionLocal, positionView } from 'three/tsl';
import type { TextureCache } from './TextureCache';
import type { ShaderMaterialComponent } from '@duckengine/ecs';
import type { EngineResourceResolver, EngineResolvedResource } from '../../resources/EngineResourceResolver';

const SHADER_CACHE = new Map<string, Promise<string>>();

export class ShaderMaterialFactory {
  static build(comp: ShaderMaterialComponent, textureCache: TextureCache): THREE.MeshBasicNodeMaterial {
    const customUniformNodes: Record<string, any> = {};

    for (const [id, u] of Object.entries(comp.uniforms)) {
      // Be resilient: handle both { value, type } and raw values
      const val = (u && typeof u === 'object' && 'value' in u) ? u.value : u;
      const type = (u && typeof u === 'object' && 'type' in u) ? u.type : 'float';
      const shaderKey = (u && typeof u === 'object' && 'key' in u && u.key) ? u.key : id;

      if (type === 'texture' && typeof val === 'string') {
        const texNode = texture(null).label(shaderKey);
        customUniformNodes[id] = texNode;
        textureCache.load(val).then((tex) => {
          texNode.value = tex;
        }).catch(console.error);
      } else if (type === 'color') {
        customUniformNodes[id] = uniform(new THREE.Color(val ?? '#ffffff')).label(shaderKey);
      } else {
        customUniformNodes[id] = uniform(val ?? 0).label(shaderKey);
      }
      console.log(`[ShaderMaterialFactory] Built uniform node: id=${id}, key=${shaderKey}, type=${type}, val=${val}`);
    }

    if (!customUniformNodes['time']) customUniformNodes['time'] = uniform(0).label('time');

    const blending =
      comp.blending === 'additive'
        ? THREE.AdditiveBlending
        : THREE.NormalBlending;

    const material = new THREE.MeshBasicNodeMaterial({
      transparent: comp.transparent,
      depthWrite: comp.depthWrite,
      blending,
    });

    // Default to magenta until resolved
    material.colorNode = color(1.0, 0.0, 1.0);

    // Store metadata so sync system can avoid redundant rebuilds
    material.userData.shaderId = comp.shaderId;
    material.userData.uniformKeys = Object.keys(comp.uniforms).sort().join(',');
    material.userData.customUniformNodes = customUniformNodes;

    return material;
  }

  static async resolveAndApplyShader(
    material: THREE.MeshBasicNodeMaterial,
    comp: ShaderMaterialComponent,
    resolver: EngineResourceResolver
  ): Promise<void> {
    if (!comp.shaderId) return;

    if (!SHADER_CACHE.has(comp.shaderId)) {
      const promise = resolver.resolve(comp.shaderId).then(async (resolved: EngineResolvedResource) => {
        let shaderUrl = '';

        // Find the shader file in the resolved resource
        for (const file of Object.values(resolved.files)) {
          if (file.fileName?.endsWith('.glsl') || file.fileName?.endsWith('.wgsl') || file.fileName?.endsWith('.tsl')) {
            shaderUrl = file.url;
            break;
          }
        }

        if (!shaderUrl) {
          throw new Error('Custom shader resource missing .glsl, .wgsl, or .tsl file');
        }

        const res = await fetch(shaderUrl);
        if (!res.ok) {
          throw new Error('Failed to download custom shader source');
        }

        return await res.text();
      });
      SHADER_CACHE.set(comp.shaderId, promise);
    }

    try {
      const source = await SHADER_CACHE.get(comp.shaderId)!;
      const cleanSource = ShaderMaterialFactory.getCleanSource(source);

      const isWgsl = comp.shaderId.toLowerCase().endsWith('.wgsl') ||
        /\bfn\s+\w+\s*\(/.test(cleanSource) ||
        cleanSource.includes('->');

      let fn: any;
      try {
        fn = isWgsl ? wgslFn(cleanSource) : glslFn(cleanSource);
      } catch (err) {
        console.error(`[ShaderMaterialFactory] Error parsing ${isWgsl ? 'WGSL' : 'GLSL'} source for ${comp.shaderId}:`, err);
        console.log(`[ShaderMaterialFactory] Cleaned source attempted:`, cleanSource.substring(0, 100));
        return;
      }

      console.log(`[ShaderMaterialFactory] Shader ${comp.shaderId} detected as ${isWgsl ? 'WGSL' : 'GLSL'}.`);
      console.log(`[ShaderMaterialFactory] TSL Object type:`, typeof fn);

      // Map of shaderKey -> node for the Proxy to use
      const nodesByName: Record<string, any> = {};
      for (const [id, u] of Object.entries(comp.uniforms)) {
        const shaderKey = ((u && typeof u === 'object' && 'key' in u && (u as any).key) ? (u as any).key : id) as string;
        const node = (material.userData.customUniformNodes as any)?.[id];
        if (node) {
          nodesByName[shaderKey] = node;
          console.log(`[ShaderMaterialFactory] Mapping node to shader key: ${shaderKey} (id: ${id})`);
        }
      }

      const baseArgs: Record<string, any> = {
        uv: uv(),
        time: time,
        normalLocal: normalLocal,
        normalView: normalView,
        positionLocal: positionLocal,
        positionView: positionView,
        ...nodesByName
      };

      // Wrap in Proxy to provide safety net for missing inputs.
      // TSL Fn will throw if a required input is missing from the arguments object.
      const callArgs = new Proxy(baseArgs, {
        get: (target, prop) => {
          if (typeof prop === 'string' && !(prop in target)) {
            // Avoid warning for standard JS/TSL internals if any
            if (prop !== 'then' && prop !== 'toJSON' && !prop.startsWith('__')) {
              console.warn(`[ShaderMaterialFactory] Shader ${comp.shaderId} requested missing input '${prop}'. Providing default float(0).`);
            }
            return float(0);
          }
          return (target as any)[prop];
        }
      });

      // Find an entry point. TSL Fn returns an object of functions (via Proxy usually).
      // Favor 'fragmentMain' or 'color' (standard TSL names), then the first non-colliding key.
      let entryPoint: any = null;
      let entryName: string = '';

      if (typeof fn === 'function') {
        entryPoint = fn;
        entryName = 'anonymous_fn';
      } else if (fn && typeof fn === 'object') {
        const keys = Object.keys(fn);
        console.log(`[ShaderMaterialFactory] Discovering TSL functions for ${comp.shaderId}:`, keys);

        // Preference order
        const candidates = ['fragmentMain', 'color', 'main'];
        for (const cand of candidates) {
          if (typeof fn[cand] === 'function') {
            entryPoint = fn[cand];
            entryName = cand;
            break;
          }
        }

        if (!entryPoint && keys.length > 0) {
          // Fallback: try to find the first non-standard property
          entryName = keys[0];
          entryPoint = fn[entryName];
        }
      }

      if (typeof entryPoint === 'function') {
        if (entryName === 'main') {
          console.warn(`[ShaderMaterialFactory] Shader function in ${comp.shaderId} is named 'main'. This often causes collisions in WebGPU. Consider renaming it to something unique (e.g. 'plasma').`);
        }
        console.log(`[ShaderMaterialFactory] Applying entry point '${entryName}' for ${comp.shaderId}`);
        material.colorNode = entryPoint(callArgs);
        material.needsUpdate = true;
      } else {
        console.warn(`[ShaderMaterialFactory] No valid shader function found in ${comp.shaderId}. Type: ${typeof fn}. Keys:`, fn ? Object.keys(fn) : 'N/A');
      }
    } catch (err) {
      console.warn(`[ShaderMaterialFactory] Error resolving shader ${comp.shaderId}:`, err);
    }
  }

  static clearCache() {
    SHADER_CACHE.clear();
  }

  /**
   * TSL parsers (wgslFn/glslFn) are very strict and require the source to start
   * with the function declaration after trimming whitespace. 
   * Leading comments break the internal Three.js regex.
   */
  private static getCleanSource(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*$/gm, '')        // Remove single-line comments
      .trim();
  }
}
