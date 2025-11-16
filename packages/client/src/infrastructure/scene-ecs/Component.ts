import type { IComponentObserver } from './IComponentObserver';
import type { ComponentMetadata } from './ComponentMetadata';
import IComponent from './IComponent';

/**
 * Clase base para todos los componentes con soporte de observación.
 * 
 * Proporciona:
 * - Sistema de observers para reactividad automática
 * - Metadata para validación de compatibilidad
 * - Notificación automática de cambios
 */
export abstract class Component implements IComponent {
  abstract readonly type: string;
  abstract readonly metadata: ComponentMetadata;

  protected entityId?: string;
  protected observers: IComponentObserver[] = [];

  /**
   * Registra un observer para recibir notificaciones de cambios.
   */
  addObserver(observer: IComponentObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  /**
   * Remueve un observer.
   */
  removeObserver(observer: IComponentObserver): void {
    const index = this.observers.indexOf(observer);
    if (index >= 0) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notifica a todos los observers que el componente ha cambiado.
   * Los componentes deben llamar este método cuando cambian sus propiedades.
   */
  protected notifyChanged(): void {
    if (!this.entityId) return;

    for (const observer of this.observers) {
      observer.onComponentChanged(this.entityId, this.type);
    }
  }

  /**
   * Establece el ID de la entity propietaria de este componente.
   * @internal Llamado por Entity al agregar el componente.
   */
  setEntityId(id: string): void {
    this.entityId = id;
  }

  /**
   * Método de actualización por frame (opcional, override si necesario).
   */
  update(dt: number): void {
    // Override en subclases si necesitan actualización por frame
  }

  /**
   * Validación custom del componente (opcional, override si necesario).
   * Permite validaciones complejas que no se pueden expresar solo con metadata.
   * 
   * @returns Array de mensajes de error, vacío si es válido
   */
  validate?(entity: any): string[];
}

export default Component;
