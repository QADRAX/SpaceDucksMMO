import type { RenderObject } from '../../domain/entities/RenderObject';

/**
 * Registry that maintains the mapping between entity IDs and their render objects.
 *
 * This is an application trait / service that tracks all active render objects
 * in the system.
 */
export class RenderObjectRegistry {
  private readonly objects = new Map<string, RenderObject>();

  /**
   * Register a render object
   */
  set(id: string, renderObj: RenderObject): void {
    this.objects.set(id, renderObj);
  }

  /**
   * Retrieve a render object by entity ID
   */
  get(id: string): RenderObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Check if object is registered
   */
  has(id: string): boolean {
    return this.objects.has(id);
  }

  /**
   * Remove a render object
   */
  remove(id: string): void {
    this.objects.delete(id);
  }

  /**
   * Get all registered objects
   */
  getAll(): IterableIterator<[string, RenderObject]> {
    return this.objects.entries();
  }

  /**
   * Clear all objects
   */
  clear(): void {
    this.objects.clear();
  }

  /**
   * Get total count
   */
  get size(): number {
    return this.objects.size;
  }
}
