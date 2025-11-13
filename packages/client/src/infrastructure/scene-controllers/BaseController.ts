import type { ISceneController } from '@client/domain/scene/ISceneController';

/**
 * Base implementation for scene controllers.
 * Handles common enable/disable logic.
 */
export abstract class BaseController implements ISceneController {
  abstract readonly id: string;
  abstract readonly name: string;
  
  private enabled = false;

  update(dt: number): void {
    if (!this.enabled) return;
    this.onUpdate(dt);
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.onEnable();
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.onDisable();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.disable();
    this.onDispose();
  }

  /**
   * Override in subclasses to implement update logic
   */
  protected abstract onUpdate(dt: number): void;

  /**
   * Override to perform initialization when enabled
   */
  protected onEnable(): void {
    // Optional override
  }

  /**
   * Override to perform cleanup when disabled
   */
  protected onDisable(): void {
    // Optional override
  }

  /**
   * Override to perform final cleanup
   */
  protected onDispose(): void {
    // Optional override
  }
}

export default BaseController;
