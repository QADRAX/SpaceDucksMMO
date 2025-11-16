import * as THREE from 'three';
import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

/**
 * Elemento individual del lens flare.
 */
export interface LensFlareElement {
  size: number;
  distance: number; // 0-1, distancia del centro al borde
  opacity: number;
  color?: [number, number, number];
  texture?: string; // path a textura
}

/**
 * Componente que define un lens flare (destello de lente).
 * Se aplica a fuentes de luz brillantes (sol, faros, explosiones).
 * El efecto es reactivo: solo se ve cuando la fuente está en el campo de visión de la cámara.
 */
export class LensFlareComponent extends Component {
  readonly type = 'lensFlare';
  readonly metadata: ComponentMetadata = {
    type: 'lensFlare',
    unique: true,
    requires: [], // No requiere nada, puede estar en cualquier entity
    conflicts: []
  };

  private _intensity: number;
  private _color: THREE.Color;
  private _flareElements: LensFlareElement[];
  private _occlusionEnabled: boolean;

  constructor(params: {
    intensity: number;
    color: [number, number, number] | string;
    flareElements: LensFlareElement[];
    occlusionEnabled?: boolean;
  }) {
    super();
    this._intensity = params.intensity;
    this._color = Array.isArray(params.color)
      ? new THREE.Color().setRGB(...params.color)
      : new THREE.Color(params.color);
    this._flareElements = params.flareElements;
    this._occlusionEnabled = params.occlusionEnabled ?? true;
  }

  // --- Propiedades reactivas ---

  get intensity(): number {
    return this._intensity;
  }

  set intensity(value: number) {
    this._intensity = value;
    this.notifyChanged();
  }

  get color(): THREE.Color {
    return this._color;
  }

  set color(value: [number, number, number] | string) {
    if (Array.isArray(value)) {
      this._color.setRGB(...value);
    } else {
      this._color.set(value);
    }
    this.notifyChanged();
  }

  get flareElements(): LensFlareElement[] {
    return this._flareElements;
  }

  set flareElements(value: LensFlareElement[]) {
    this._flareElements = value;
    this.notifyChanged();
  }

  get occlusionEnabled(): boolean {
    return this._occlusionEnabled;
  }

  set occlusionEnabled(value: boolean) {
    this._occlusionEnabled = value;
    this.notifyChanged();
  }

  /**
   * Agrega un elemento al flare.
   */
  addElement(element: LensFlareElement): void {
    this._flareElements.push(element);
    this.notifyChanged();
  }

  /**
   * Remueve un elemento del flare por índice.
   */
  removeElement(index: number): void {
    if (index >= 0 && index < this._flareElements.length) {
      this._flareElements.splice(index, 1);
      this.notifyChanged();
    }
  }
}

export default LensFlareComponent;
