/**
 * Metadata para validación de compatibilidad de componentes.
 */
export interface ComponentMetadata {
  /** Tipo del componente (debe coincidir con IComponent.type) */
  type: string;

  /** Componentes que DEBEN existir para que este funcione */
  requires?: string[];

  /** Componentes que NO pueden coexistir con este */
  conflicts?: string[];

  /** Solo puede haber uno de este tipo por entity */
  unique?: boolean;
}

export default ComponentMetadata;
