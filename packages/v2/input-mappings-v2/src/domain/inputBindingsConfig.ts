import type { BindingSource } from './bindingSource';

export interface ActionBinding {
  action: string;
  sources: BindingSource[];
}

export interface InputBindingsConfig {
  /** Acciones y sus fuentes. Múltiples fuentes = OR (cualquiera activa la acción). */
  bindings: ActionBinding[];
  /** Sensibilidad por acción (opcional). Aplicado a mouse axes. */
  sensitivity?: Record<string, number>;
}
