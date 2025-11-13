/**
 * Domain abstraction for scene controllers.
 * Controllers provide programmatic control over scene elements (camera, objects, etc.)
 * They can be controlled from scenes, UI, or external systems.
 * 
 * Examples:
 * - OrbitCameraController: Orbits camera around a target
 * - FollowCameraController: Follows a moving object
 * - ObjectSpinController: Rotates an object continuously
 * - TimeScaleController: Controls scene simulation speed
 */
export interface ISceneController {
  /** Unique identifier for this controller */
  readonly id: string;
  
  /** Human-readable name for UI/debugging */
  readonly name: string;
  
  /** Update controller state (called per frame) */
  update(dt: number): void;
  
  /** Initialize/activate the controller */
  enable(): void;
  
  /** Deactivate the controller */
  disable(): void;
  
  /** Check if controller is currently active */
  isEnabled(): boolean;
  
  /** Optional cleanup */
  dispose?(): void;
}

/**
 * Controllers that can be controlled via parameters (from UI or code)
 */
export interface IParametricController extends ISceneController {
  /** Get available control parameters */
  getParameters(): ControlParameter[];
  
  /** Set a parameter value */
  setParameter(name: string, value: any): void;
  
  /** Get current parameter value */
  getParameter(name: string): any;
}

/**
 * Definition of a controllable parameter
 */
export interface ControlParameter {
  name: string;
  label: string;
  type: 'number' | 'boolean' | 'string' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: any; label: string }>;
  defaultValue: any;
  description?: string;
}

export default ISceneController;
