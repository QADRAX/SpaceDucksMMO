/**
 * Observer interface para reactividad de componentes.
 * Los sistemas (RenderSyncSystem, etc.) implementan esta interface
 * para recibir notificaciones cuando los componentes cambian.
 */
export interface IComponentObserver {
  /**
   * Llamado cuando un componente cambia sus propiedades.
   * 
   * @param entityId - ID de la entity que contiene el componente
   * @param componentType - Tipo del componente que cambió
   */
  onComponentChanged(entityId: string, componentType: string): void;
}

export default IComponentObserver;
