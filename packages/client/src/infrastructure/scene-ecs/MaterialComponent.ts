import * as THREE from 'three';
import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

/**
 * Parámetros para diferentes tipos de materiales.
 */
export type MaterialParameters =
  | {
      type: 'standard';
      color?: string | number;
      metalness?: number;
      roughness?: number;
      emissive?: string | number;
      emissiveIntensity?: number;
      transparent?: boolean;
      opacity?: number;
    }
  | {
      type: 'basic';
      color?: string | number;
      transparent?: boolean;
      opacity?: number;
      wireframe?: boolean;
    }
  | {
      type: 'phong';
      color?: string | number;
      specular?: string | number;
      shininess?: number;
      emissive?: string | number;
      transparent?: boolean;
      opacity?: number;
    }
  | {
      type: 'lambert';
      color?: string | number;
      emissive?: string | number;
      transparent?: boolean;
      opacity?: number;
    };

/**
 * Componente que define el material visual de una entity.
 * Requiere GeometryComponent para tener efecto.
 */
export class MaterialComponent extends Component {
  readonly type = 'material';
  readonly metadata: ComponentMetadata = {
    type: 'material',
    unique: true,
    requires: ['geometry'], // Material requiere geometría
    conflicts: ['shaderMaterial'] // No puede coexistir con shader material custom
  };

  private _parameters: MaterialParameters;
  private _texture?: string; // Path a textura (se carga async)
  private _normalMap?: string;
  private _envMap?: string;

  constructor(parameters: MaterialParameters) {
    super();
    this._parameters = parameters;
  }

  get parameters(): MaterialParameters {
    return this._parameters;
  }

  set parameters(value: MaterialParameters) {
    this._parameters = value;
    this.notifyChanged();
  }

  // --- Texturas ---

  get texture(): string | undefined {
    return this._texture;
  }

  set texture(value: string | undefined) {
    this._texture = value;
    this.notifyChanged();
  }

  get normalMap(): string | undefined {
    return this._normalMap;
  }

  set normalMap(value: string | undefined) {
    this._normalMap = value;
    this.notifyChanged();
  }

  get envMap(): string | undefined {
    return this._envMap;
  }

  set envMap(value: string | undefined) {
    this._envMap = value;
    this.notifyChanged();
  }

  // --- Propiedades reactivas (shortcuts para parámetros comunes) ---

  get color(): string | number | undefined {
    return this._parameters.color;
  }

  set color(value: string | number | undefined) {
    this._parameters = { ...this._parameters, color: value };
    this.notifyChanged();
  }

  get opacity(): number | undefined {
    return this._parameters.opacity;
  }

  set opacity(value: number | undefined) {
    this._parameters = { ...this._parameters, opacity: value };
    this.notifyChanged();
  }

  get transparent(): boolean | undefined {
    return this._parameters.transparent;
  }

  set transparent(value: boolean | undefined) {
    this._parameters = { ...this._parameters, transparent: value };
    this.notifyChanged();
  }

  // --- Creación de material THREE.js ---

  /**
   * Crea el material de THREE.js basándose en los parámetros.
   * Las texturas se cargan de forma async por el RenderSyncSystem.
   */
  createThreeMaterial(): THREE.Material {
    const params = this._parameters;

    switch (params.type) {
      case 'standard':
        {
          const opts: THREE.MeshStandardMaterialParameters = {};
          if (params.color !== undefined) opts.color = new THREE.Color(params.color);
          if (params.metalness !== undefined) opts.metalness = params.metalness;
          if (params.roughness !== undefined) opts.roughness = params.roughness;
          if (params.emissive !== undefined) opts.emissive = new THREE.Color(params.emissive);
          if (params.emissiveIntensity !== undefined) opts.emissiveIntensity = params.emissiveIntensity;
          if (params.transparent !== undefined) opts.transparent = params.transparent;
          if (params.opacity !== undefined) opts.opacity = params.opacity;
          return new THREE.MeshStandardMaterial(opts);
        }

      case 'basic':
        {
          const opts: THREE.MeshBasicMaterialParameters = {};
          if (params.color !== undefined) opts.color = new THREE.Color(params.color);
          if (params.transparent !== undefined) opts.transparent = params.transparent;
          if (params.opacity !== undefined) opts.opacity = params.opacity;
          if ((params as any).wireframe !== undefined) opts.wireframe = (params as any).wireframe;
          return new THREE.MeshBasicMaterial(opts);
        }

      case 'phong':
        {
          const p = params as Extract<MaterialParameters, { type: 'phong' }>;
          const opts: THREE.MeshPhongMaterialParameters = {};
          if (p.color !== undefined) opts.color = new THREE.Color(p.color);
          if (p.specular !== undefined) opts.specular = new THREE.Color(p.specular);
          if (p.shininess !== undefined) opts.shininess = p.shininess;
          if (p.emissive !== undefined) opts.emissive = new THREE.Color(p.emissive);
          if (p.transparent !== undefined) opts.transparent = p.transparent;
          if (p.opacity !== undefined) opts.opacity = p.opacity;
          return new THREE.MeshPhongMaterial(opts);
        }

      case 'lambert':
        {
          const p = params as Extract<MaterialParameters, { type: 'lambert' }>;
          const opts: THREE.MeshLambertMaterialParameters = {};
          if (p.color !== undefined) opts.color = new THREE.Color(p.color);
          if (p.emissive !== undefined) opts.emissive = new THREE.Color(p.emissive);
          if (p.transparent !== undefined) opts.transparent = p.transparent;
          if (p.opacity !== undefined) opts.opacity = p.opacity;
          return new THREE.MeshLambertMaterial(opts);
        }

      default:
        throw new Error(`Unknown material type`);
    }
  }
}

export default MaterialComponent;
