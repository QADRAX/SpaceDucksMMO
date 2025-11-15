import type IComponent from './IComponent';
import type { TransformComponent } from './TransformComponent';

export class RotationComponent implements IComponent {
  readonly type = 'rotation';
  constructor(private transform: TransformComponent, public speed = 0.01) {}

  update(dt: number): void {
    // speed is in radians per ms (small values)
    this.transform.rotation.y += this.speed * dt;
  }
}

export default RotationComponent;
