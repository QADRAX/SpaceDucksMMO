import * as THREE from 'three';
import type { Entity } from './Entity';
import type { IComponentObserver } from './IComponentObserver';
import { GeometryComponent } from './GeometryComponent';
import { MaterialComponent } from './MaterialComponent';
import { ShaderMaterialComponent } from './ShaderMaterialComponent';
import { CameraViewComponent } from './CameraViewComponent';
import { LightComponent } from './LightComponent';

/**
 * Componente de renderizado que enlaza una Entity con su representación THREE.js.
 */
interface RenderComponent {
  entityId: string;
  object3D?: THREE.Object3D; // Puede ser Mesh, Camera, Light, Group, etc.
  material?: THREE.Material;
  geometry?: THREE.BufferGeometry;
}

/**
 * Sistema que sincroniza entities con THREE.js.
 * 
 * Responsabilidades:
 * - Crear THREE.Object3D desde componentes (Geometry+Material → Mesh, CameraView → Camera)
 * - Sincronizar Transform → Object3D.position/rotation/scale
 * - Observar cambios en componentes y actualizar THREE.js automáticamente
 * - Gestionar ciclo de vida de objetos THREE.js (dispose)
 */
export class RenderSyncSystem implements IComponentObserver {
  private scene: THREE.Scene;
  private renderComponents = new Map<string, RenderComponent>();
  private entities = new Map<string, Entity>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // --- Gestión de entities ---

  /**
   * Registra una entity para sincronización.
   * Crea los objetos THREE.js necesarios y los agrega a la escena.
   */
  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);

    // Registrar como observer de todos los componentes
    for (const component of entity.getAllComponents()) {
      component.addObserver(this);
    }

    // Registrar observer del transform
    entity.transform.onChange(() => this.onTransformChanged(entity.id));

    // Procesar la entity según sus componentes
    this.processEntity(entity);

    // Procesar hijos recursivamente
    for (const child of entity.getChildren()) {
      this.addEntity(child);
    }
  }

  /**
   * Desregistra una entity y limpia sus objetos THREE.js.
   */
  removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    // Remover hijos primero
    for (const child of entity.getChildren()) {
      this.removeEntity(child.id);
    }

    // Limpiar render component
    const rc = this.renderComponents.get(entityId);
    if (rc) {
      if (rc.object3D) {
        this.scene.remove(rc.object3D);
      }
      if (rc.geometry) {
        rc.geometry.dispose();
      }
      if (rc.material) {
        if (Array.isArray(rc.material)) {
          rc.material.forEach(m => m.dispose());
        } else {
          rc.material.dispose();
        }
      }
      this.renderComponents.delete(entityId);
    }

    this.entities.delete(entityId);
  }

  /**
   * Obtiene la cámara THREE.js de una entity con CameraViewComponent.
   */
  getCamera(entityId: string): THREE.Camera | undefined {
    const rc = this.renderComponents.get(entityId);
    if (rc?.object3D instanceof THREE.Camera) {
      return rc.object3D;
    }
    return undefined;
  }

  /**
   * Obtiene todas las entities registradas.
   */
  getEntities(): Map<string, Entity> {
    return this.entities;
  }

  // --- IComponentObserver implementation ---

  onComponentChanged(entityId: string, componentType: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    switch (componentType) {
      case 'geometry':
      case 'shaderMaterial':
        // Geometría o shader material cambió: recrear mesh
        this.recreateMesh(entity);
        break;

      case 'material':
        // Material cambió: actualizar material del mesh
        this.syncMaterial(entity);
        break;

      case 'cameraView':
        // Parámetros de cámara cambiaron: actualizar camera
        this.syncCamera(entity);
        break;

      default:
        // Otros componentes: depende del sistema especializado
        break;
    }
  }

  // --- Procesamiento de entities ---

  private processEntity(entity: Entity): void {
    // Caso 1: Entity con geometría → crear Mesh
    const geometry = entity.getComponent<GeometryComponent>('geometry');
    const material = entity.getComponent<MaterialComponent>('material');
    const shaderMaterial = entity.getComponent<ShaderMaterialComponent>('shaderMaterial');

    if (geometry && (material || shaderMaterial)) {
      this.createMesh(entity, geometry, material, shaderMaterial);
      return;
    }

    // Caso 2: Entity con cámara → crear Camera
    const cameraView = entity.getComponent<CameraViewComponent>('cameraView');
    if (cameraView) {
      this.createCamera(entity, cameraView);
      return;
    }

    // Caso 3: Entity con luz → crear Light
    const lightComp = entity.getComponent<LightComponent>('light');
    if (lightComp) {
      this.createLight(entity, lightComp);
      return;
    }

    // Caso 4: Entity sin renderización visual (solo lógica, ej: waypoint)
    // No se crea nada en THREE.js, pero se trackea por si luego se agregan componentes
  }

  private createMesh(
    entity: Entity,
    geometryComp: GeometryComponent,
    materialComp?: MaterialComponent,
    shaderMaterialComp?: ShaderMaterialComponent
  ): void {
    // Crear geometría
    const geometry = geometryComp.createThreeGeometry();

    // Crear material
    let material: THREE.Material;
    if (shaderMaterialComp) {
      material = shaderMaterialComp.createThreeMaterial();
    } else if (materialComp) {
      material = materialComp.createThreeMaterial();
    } else {
      material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    }

    // Crear mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Sincronizar transform
    this.syncTransformToObject3D(entity, mesh);

    // Agregar a escena
    this.scene.add(mesh);

    // Guardar render component
    this.renderComponents.set(entity.id, {
      entityId: entity.id,
      object3D: mesh,
      geometry,
      material
    });
  }

  private createCamera(entity: Entity, cameraView: CameraViewComponent): void {
    const camera = cameraView.createThreeCamera();

    // Sincronizar transform
    this.syncTransformToObject3D(entity, camera);

    // Guardar render component (la cámara NO se agrega a la escena)
    this.renderComponents.set(entity.id, {
      entityId: entity.id,
      object3D: camera
    });
  }

  private recreateMesh(entity: Entity): void {
    // Remover mesh actual
    const rc = this.renderComponents.get(entity.id);
    if (rc?.object3D) {
      this.scene.remove(rc.object3D);
      if (rc.geometry) rc.geometry.dispose();
      if (rc.material) {
        if (Array.isArray(rc.material)) {
          rc.material.forEach(m => m.dispose());
        } else {
          rc.material.dispose();
        }
      }
    }

    // Recrear
    const geometry = entity.getComponent<GeometryComponent>('geometry');
    const material = entity.getComponent<MaterialComponent>('material');
    const shaderMaterial = entity.getComponent<ShaderMaterialComponent>('shaderMaterial');

    if (geometry && (material || shaderMaterial)) {
      this.createMesh(entity, geometry, material, shaderMaterial);
    }
  }

  private syncMaterial(entity: Entity): void {
    const rc = this.renderComponents.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

    const materialComp = entity.getComponent<MaterialComponent>('material');
    if (!materialComp) return;

    // Dispose material anterior
    if (rc.material) {
      if (Array.isArray(rc.material)) {
        rc.material.forEach(m => m.dispose());
      } else {
        rc.material.dispose();
      }
    }

    // Crear nuevo material
    const newMaterial = materialComp.createThreeMaterial();
    rc.object3D.material = newMaterial;
    rc.material = newMaterial;
  }

  private syncCamera(entity: Entity): void {
    const rc = this.renderComponents.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.PerspectiveCamera)) return;

    const cameraView = entity.getComponent<CameraViewComponent>('cameraView');
    if (!cameraView) return;

    const camera = rc.object3D;
    camera.fov = cameraView.fov;
    camera.aspect = cameraView.aspect;
    camera.near = cameraView.near;
    camera.far = cameraView.far;
    camera.updateProjectionMatrix();
  }

  private onTransformChanged(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    const rc = this.renderComponents.get(entityId);
    if (!rc?.object3D) return;

    this.syncTransformToObject3D(entity, rc.object3D);

    // Si es luz direccional/spot, también actualizar su target
    if (rc.object3D instanceof THREE.DirectionalLight || rc.object3D instanceof THREE.SpotLight) {
      const light = rc.object3D as THREE.DirectionalLight | THREE.SpotLight;
      const forward = entity.transform.getForward();
      const targetPos = new THREE.Vector3().copy(entity.transform.worldPosition).add(forward.multiplyScalar(10));
      light.target.position.copy(targetPos);
    }
  }

  private syncTransformToObject3D(entity: Entity, object3D: THREE.Object3D): void {
    const transform = entity.transform;
    object3D.position.copy(transform.worldPosition);
    object3D.rotation.copy(transform.worldRotation);
    object3D.scale.copy(transform.worldScale);
  }

  // --- Update loop ---

  /**
   * Actualiza uniforms de shaders (ej: time) cada frame.
   */
  update(dt: number): void {
    for (const [entityId, rc] of this.renderComponents) {
      const entity = this.entities.get(entityId);
      if (!entity) continue;

      // Actualizar uniforms de shader materials
      const shaderMat = entity.getComponent<ShaderMaterialComponent>('shaderMaterial');
      if (shaderMat && rc.object3D instanceof THREE.Mesh) {
        const material = rc.object3D.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          // Actualizar uniform 'time' si existe
          if (material.uniforms.time) {
            material.uniforms.time.value += dt;
          }

          // Sincronizar otros uniforms desde el componente
          for (const [key, uniform] of Object.entries(shaderMat.uniforms)) {
            if (material.uniforms[key]) {
              material.uniforms[key].value = uniform.value;
            }
          }
        }
      }
    }
  }

  // --- Luces ---
  private createLight(entity: Entity, lightComp: LightComponent): void {
    const params = lightComp.params;

    let light: THREE.Light;

    switch (params.type) {
      case 'ambient': {
        const color = params.color !== undefined ? new THREE.Color(params.color) : new THREE.Color(0xffffff);
        const intensity = params.intensity ?? 0.5;
        light = new THREE.AmbientLight(color, intensity);
        break;
      }
      case 'directional': {
        const color = params.color !== undefined ? new THREE.Color(params.color) : new THREE.Color(0xffffff);
        const intensity = params.intensity ?? 1.0;
        const dir = new THREE.DirectionalLight(color, intensity);
        // Inicializar target según forward del transform
        const forward = entity.transform.getForward();
        const targetPos = new THREE.Vector3().copy(entity.transform.worldPosition).add(forward.multiplyScalar(10));
        dir.position.copy(entity.transform.worldPosition);
        dir.target.position.copy(targetPos);
        this.scene.add(dir.target);
        light = dir;
        break;
      }
      case 'point': {
        const color = params.color !== undefined ? new THREE.Color(params.color) : new THREE.Color(0xffffff);
        const intensity = params.intensity ?? 1.0;
        const distance = (params as any).distance ?? 0;
        const decay = (params as any).decay ?? 1;
        const point = new THREE.PointLight(color, intensity, distance, decay);
        point.position.copy(entity.transform.worldPosition);
        light = point;
        break;
      }
      case 'spot': {
        const color = params.color !== undefined ? new THREE.Color(params.color) : new THREE.Color(0xffffff);
        const intensity = params.intensity ?? 1.0;
        const distance = (params as any).distance ?? 0;
        const angle = (params as any).angle ?? Math.PI / 6;
        const penumbra = (params as any).penumbra ?? 0.0;
        const decay = (params as any).decay ?? 1;
        const spot = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
        spot.position.copy(entity.transform.worldPosition);
        const forward = entity.transform.getForward();
        const targetPos = new THREE.Vector3().copy(entity.transform.worldPosition).add(forward.multiplyScalar(10));
        spot.target.position.copy(targetPos);
        this.scene.add(spot.target);
        light = spot;
        break;
      }
      default:
        throw new Error(`Unknown light type: ${(params as any).type}`);
    }

    this.scene.add(light);

    // Guardar render component
    this.renderComponents.set(entity.id, {
      entityId: entity.id,
      object3D: light
    });
  }
}

export default RenderSyncSystem;
