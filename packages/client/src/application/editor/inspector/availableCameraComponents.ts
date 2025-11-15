import * as THREE from 'three';
import { OrbitComponent } from '@client/infrastructure/scene-objects/cameras/components/OrbitComponent';
import { LookAtComponent } from '@client/infrastructure/scene-objects/cameras/components/LookAtComponent';
import { TargetTrackingComponent } from '@client/infrastructure/scene-objects/cameras/components/TargetTrackingComponent';
import type { ComponentMetadata } from '@client/domain/scene/IComponentManager';

/**
 * Camera component factory function
 */
export type CameraComponentFactory = () => any;

/**
 * Available camera component definition
 */
export interface AvailableCameraComponent {
  metadata: ComponentMetadata;
  factory: CameraComponentFactory;
}

/**
 * Registry of all available camera components that can be added via UI
 */
export const availableCameraComponents: AvailableCameraComponent[] = [
  {
    metadata: {
      instanceId: '',
      displayName: 'Orbit',
      category: 'Camera Behavior',
      description: 'Makes camera orbit around a target point',
      icon: '🔄'
    },
    factory: () => new OrbitComponent({
      target: new THREE.Vector3(0, 0, 0),
      distance: 10,
      height: 0,
      speed: 0.001,
      autoRotate: true
    })
  },
  {
    metadata: {
      instanceId: '',
      displayName: 'Look At',
      category: 'Camera Behavior',
      description: 'Makes camera always look at a target point',
      icon: '👁️'
    },
    factory: () => new LookAtComponent({
      target: new THREE.Vector3(0, 0, 0)
    })
  },
  {
    metadata: {
      instanceId: '',
      displayName: 'Target Tracking',
      category: 'Camera Behavior',
      description: 'Makes camera follow and track a moving target object',
      icon: '🎯'
    },
    factory: () => new TargetTrackingComponent({
      targetObjectId: null
    })
  }
];
