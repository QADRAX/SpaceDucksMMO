import * as THREE from 'three';
import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

/**
 * Definición de un uniform de shader.
 */
export interface ShaderUniform {
  value: any;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'color' | 'texture';
}

/**
 * Tipos de shaders predefinidos.
 */
export type ShaderType = 'atmosphere' | 'corona' | 'rings' | 'nebula' | 'custom';

/**
 * Componente para materiales con shaders personalizados.
 * Permite efectos visuales avanzados (atmósferas, coronas solares, etc.)
 */
export class ShaderMaterialComponent extends Component {
  readonly type = 'shaderMaterial';
  readonly metadata: ComponentMetadata = {
    type: 'shaderMaterial',
    unique: true,
    requires: ['geometry'], // Requiere geometría para aplicar el shader
    conflicts: ['material'] // No puede coexistir con MaterialComponent básico
  };

  private _shaderType: ShaderType;
  private _uniforms: Record<string, ShaderUniform>;
  private _vertexShader?: string;
  private _fragmentShader?: string;
  private _transparent: boolean;
  private _depthWrite: boolean;
  private _blending: THREE.Blending;

  constructor(params: {
    shaderType: ShaderType;
    uniforms: Record<string, ShaderUniform>;
    vertexShader?: string;
    fragmentShader?: string;
    transparent?: boolean;
    depthWrite?: boolean;
    blending?: THREE.Blending;
  }) {
    super();
    this._shaderType = params.shaderType;
    this._uniforms = params.uniforms;
    this._vertexShader = params.vertexShader;
    this._fragmentShader = params.fragmentShader;
    this._transparent = params.transparent ?? true;
    this._depthWrite = params.depthWrite ?? false;
    this._blending = params.blending ?? THREE.AdditiveBlending;
  }

  // --- Propiedades ---

  get shaderType(): ShaderType {
    return this._shaderType;
  }

  get uniforms(): Record<string, ShaderUniform> {
    return this._uniforms;
  }

  get vertexShader(): string | undefined {
    return this._vertexShader;
  }

  get fragmentShader(): string | undefined {
    return this._fragmentShader;
  }

  get transparent(): boolean {
    return this._transparent;
  }

  set transparent(value: boolean) {
    this._transparent = value;
    this.notifyChanged();
  }

  /**
   * Actualiza un uniform y notifica el cambio.
   */
  setUniform(name: string, value: any): void {
    if (this._uniforms[name]) {
      this._uniforms[name].value = value;
      this.notifyChanged();
    }
  }

  /**
   * Actualiza múltiples uniforms.
   */
  setUniforms(uniforms: Record<string, any>): void {
    for (const [name, value] of Object.entries(uniforms)) {
      if (this._uniforms[name]) {
        this._uniforms[name].value = value;
      }
    }
    this.notifyChanged();
  }

  /**
   * Convierte los uniforms al formato de THREE.js.
   */
  convertUniformsToThree(): Record<string, THREE.IUniform> {
    const threeUniforms: Record<string, THREE.IUniform> = {};

    for (const [name, uniform] of Object.entries(this._uniforms)) {
      if (uniform.type === 'color') {
        threeUniforms[name] = { value: new THREE.Color(uniform.value) };
      } else if (uniform.type === 'vec3' && Array.isArray(uniform.value)) {
        threeUniforms[name] = { value: new THREE.Vector3(...uniform.value) };
      } else if (uniform.type === 'vec2' && Array.isArray(uniform.value)) {
        threeUniforms[name] = { value: new THREE.Vector2(...uniform.value) };
      } else {
        threeUniforms[name] = { value: uniform.value };
      }
    }

    return threeUniforms;
  }

  /**
   * Crea el material de THREE.js con el shader.
   * El RenderSyncSystem usa esto para crear el material.
   */
  createThreeMaterial(): THREE.ShaderMaterial {
    const uniforms = this.convertUniformsToThree();

    let vertexShader = this._vertexShader;
    let fragmentShader = this._fragmentShader;

    // Si es un shader predefinido y no se proporcionaron shaders custom, usar los predefinidos
    if (!vertexShader || !fragmentShader) {
      const predefined = this.getPredefinedShaders();
      vertexShader = predefined.vertex;
      fragmentShader = predefined.fragment;
    }

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: this._transparent,
      depthWrite: this._depthWrite,
      blending: this._blending,
      side: THREE.DoubleSide
    });
  }

  /**
   * Obtiene shaders predefinidos según el tipo.
   */
  private getPredefinedShaders(): { vertex: string; fragment: string } {
    switch (this._shaderType) {
      case 'atmosphere':
        return this.getAtmosphereShaders();
      case 'corona':
        return this.getCoronaShaders();
      case 'rings':
        return this.getRingsShaders();
      default:
        throw new Error(`No predefined shaders for type '${this._shaderType}'. Provide custom shaders.`);
    }
  }

  private getAtmosphereShaders(): { vertex: string; fragment: string } {
    const vertex = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragment = `
      uniform vec3 atmosphereColor;
      uniform float atmosphereThickness;
      uniform float glowIntensity;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec3 viewDirection = normalize(-vPosition);
        float intensity = pow(1.0 - abs(dot(vNormal, viewDirection)), atmosphereThickness);
        vec3 glow = atmosphereColor * intensity * glowIntensity;
        gl_FragColor = vec4(glow, intensity);
      }
    `;

    return { vertex, fragment };
  }

  private getCoronaShaders(): { vertex: string; fragment: string } {
    const vertex = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragment = `
      uniform vec3 baseColor;
      uniform vec3 coronaColor;
      uniform float coronaSize;
      uniform float flickerSpeed;
      uniform float time;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec3 viewDirection = normalize(-vPosition);
        float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
        
        // Animación de flicker
        float flicker = sin(time * flickerSpeed) * 0.1 + 0.9;
        
        float coronaIntensity = pow(fresnel, coronaSize) * flicker;
        vec3 color = mix(baseColor, coronaColor, coronaIntensity);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    return { vertex, fragment };
  }

  private getRingsShaders(): { vertex: string; fragment: string } {
    // TODO: Implementar shader de anillos planetarios
    throw new Error('Rings shader not implemented yet');
  }
}

export default ShaderMaterialComponent;
