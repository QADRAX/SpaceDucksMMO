import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

/**
 * Definición de un efecto de post-procesado.
 */
export interface PostProcessEffect {
  name: string;
  type: 'bloom' | 'tonemap' | 'vignette' | 'chromaticAberration' | 'fxaa' | 'custom';
  enabled: boolean;
  parameters: Record<string, any>;
}

/**
 * Componente de post-procesado para cámaras.
 * Define efectos que se aplican a toda la imagen renderizada.
 */
export class PostProcessComponent extends Component {
  readonly type = 'postProcess';
  readonly metadata: ComponentMetadata = {
    type: 'postProcess',
    unique: true,
    requires: ['cameraView'], // Solo en entities con cámara
    conflicts: []
  };

  private _effects: PostProcessEffect[];

  constructor(effects: PostProcessEffect[]) {
    super();
    this._effects = effects;
  }

  get effects(): PostProcessEffect[] {
    return this._effects;
  }

  /**
   * Agrega un efecto al stack.
   */
  addEffect(effect: PostProcessEffect): void {
    this._effects.push(effect);
    this.notifyChanged();
  }

  /**
   * Remueve un efecto por nombre.
   */
  removeEffect(name: string): void {
    const index = this._effects.findIndex(e => e.name === name);
    if (index >= 0) {
      this._effects.splice(index, 1);
      this.notifyChanged();
    }
  }

  /**
   * Obtiene un efecto por nombre.
   */
  getEffect(name: string): PostProcessEffect | undefined {
    return this._effects.find(e => e.name === name);
  }

  /**
   * Habilita/deshabilita un efecto.
   */
  setEffectEnabled(name: string, enabled: boolean): void {
    const effect = this.getEffect(name);
    if (effect) {
      effect.enabled = enabled;
      this.notifyChanged();
    }
  }

  /**
   * Actualiza parámetros de un efecto.
   */
  updateEffectParameters(name: string, parameters: Record<string, any>): void {
    const effect = this.getEffect(name);
    if (effect) {
      effect.parameters = { ...effect.parameters, ...parameters };
      this.notifyChanged();
    }
  }

  /**
   * Obtiene solo los efectos habilitados en orden.
   */
  getEnabledEffects(): PostProcessEffect[] {
    return this._effects.filter(e => e.enabled);
  }
}

export default PostProcessComponent;
