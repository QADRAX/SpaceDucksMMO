import * as THREE from 'three';
import type { Entity } from '../../../domain/ecs/core/Entity';
import type IComponentObserver from '../../../domain/ecs/core/IComponentObserver';
import { GeometryComponent } from '../../../domain/ecs/components/GeometryComponent';
import { MaterialComponent } from '../../../domain/ecs/components/MaterialComponent';
import { ShaderMaterialComponent } from '../../../domain/ecs/components/ShaderMaterialComponent';
import { CameraViewComponent } from '../../../domain/ecs/components/CameraViewComponent';
import { LightComponent } from '../../../domain/ecs/components/LightComponent';

interface RenderComponent {
  entityId: string;
  object3D?: THREE.Object3D;
  material?: THREE.Material;
  geometry?: THREE.BufferGeometry;
}

export class RenderSyncSystem implements IComponentObserver {
  private scene: THREE.Scene;
  private renderComponents = new Map<string, RenderComponent>();
  private entities = new Map<string, Entity>();
  private textureLoader = new THREE.TextureLoader();

  constructor(scene: THREE.Scene) { this.scene = scene; }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    for (const comp of entity.getAllComponents()) comp.addObserver(this);
    entity.transform.onChange(() => this.onTransformChanged(entity.id));
    this.processEntity(entity);
    for (const child of entity.getChildren()) this.addEntity(child);
  }

  removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId); if (!entity) return;
    for (const child of entity.getChildren()) this.removeEntity(child.id);
    const rc = this.renderComponents.get(entityId);
    if (rc) {
      if (rc.object3D) this.scene.remove(rc.object3D);
      if (rc.geometry) rc.geometry.dispose();
      if (rc.material) {
        if (Array.isArray(rc.material)) (rc.material as any).forEach((m: THREE.Material)=>m.dispose()); else rc.material.dispose();
      }
      this.renderComponents.delete(entityId);
    }
    this.entities.delete(entityId);
  }

  getCamera(entityId: string): THREE.Camera | undefined {
    const rc = this.renderComponents.get(entityId); return rc?.object3D instanceof THREE.Camera ? rc.object3D : undefined;
  }

  getEntities(): Map<string, Entity> { return this.entities; }

  onComponentChanged(entityId: string, componentType: string): void {
    const entity = this.entities.get(entityId); if (!entity) return;
    switch (componentType) {
      case 'geometry':
      case 'shaderMaterial':
        this.recreateMesh(entity); break;
      case 'material':
        this.syncMaterial(entity); break;
      case 'cameraView':
        this.syncCamera(entity); break;
      case 'light':
        this.recreateLight(entity); break;
      default: break;
    }
  }

  private processEntity(entity: Entity): void {
    const geometry = entity.getComponent<GeometryComponent>('geometry');
    const material = entity.getComponent<MaterialComponent>('material');
    const shaderMaterial = entity.getComponent<ShaderMaterialComponent>('shaderMaterial');
    if (geometry && (material || shaderMaterial)) { this.createMesh(entity, geometry, material, shaderMaterial); return; }
    const cameraView = entity.getComponent<CameraViewComponent>('cameraView');
    if (cameraView) { this.createCamera(entity, cameraView); return; }
    const lightComp = entity.getComponent<LightComponent>('light');
    if (lightComp) { this.createLight(entity, lightComp); return; }
  }

  private buildGeometry(params: GeometryComponent['parameters']): THREE.BufferGeometry {
    switch (params.type) {
      case 'sphere': return new THREE.SphereGeometry(params.radius, params.widthSegments ?? 32, params.heightSegments ?? 16);
      case 'box': return new THREE.BoxGeometry(params.width, params.height, params.depth);
      case 'plane': return new THREE.PlaneGeometry(params.width, params.height, params.widthSegments ?? 1, params.heightSegments ?? 1);
      case 'cylinder': return new THREE.CylinderGeometry(params.radiusTop, params.radiusBottom, params.height, params.radialSegments ?? 16);
      case 'cone': return new THREE.ConeGeometry(params.radius, params.height, params.radialSegments ?? 16);
      case 'torus': return new THREE.TorusGeometry(params.radius, params.tube, params.radialSegments ?? 16, params.tubularSegments ?? 48);
      case 'custom':
        console.warn(`[RenderSyncSystem] custom geometry key='${params.key}' not implemented; using unit box`);
        return new THREE.BoxGeometry(1,1,1);
      default:
        return new THREE.BoxGeometry(1,1,1);
    }
  }

  private buildMaterial(comp?: MaterialComponent): THREE.Material | undefined {
    if (!comp) return undefined; const p = comp.parameters;
    let material: THREE.Material;
    switch (p.type) {
      case 'standard': material = new THREE.MeshStandardMaterial({ color: p.color as any, metalness: (p as any).metalness, roughness: (p as any).roughness, emissive: (p as any).emissive as any, emissiveIntensity: (p as any).emissiveIntensity, transparent: (p as any).transparent, opacity: (p as any).opacity }); break;
      case 'basic': material = new THREE.MeshBasicMaterial({ color: p.color as any, transparent: (p as any).transparent, opacity: (p as any).opacity, wireframe: (p as any).wireframe }); break;
      case 'phong': material = new THREE.MeshPhongMaterial({ color: p.color as any, specular: (p as any).specular as any, shininess: (p as any).shininess, emissive: (p as any).emissive as any, transparent: (p as any).transparent, opacity: (p as any).opacity }); break;
      case 'lambert': material = new THREE.MeshLambertMaterial({ color: p.color as any, emissive: (p as any).emissive as any, transparent: (p as any).transparent, opacity: (p as any).opacity }); break;
      default: material = new THREE.MeshStandardMaterial({ color: 0xcccccc }); break;
    }
    // textures
    if (comp.texture) { this.textureLoader.load(comp.texture, tex => { (material as any).map = tex; material.needsUpdate = true; }); }
    if (comp.normalMap) { this.textureLoader.load(comp.normalMap, tex => { (material as any).normalMap = tex; material.needsUpdate = true; }); }
    if (comp.envMap) { this.textureLoader.load(comp.envMap, tex => { (material as any).envMap = tex; material.needsUpdate = true; }); }
    return material;
  }

  private buildShaderMaterial(comp?: ShaderMaterialComponent): THREE.ShaderMaterial | undefined {
    if (!comp) return undefined;
    const uniforms: Record<string, { value: any }> = {};
    for (const [k,u] of Object.entries(comp.uniforms)) {
      if (u.type === 'texture') {
        uniforms[k] = { value: null };
        this.textureLoader.load(u.value, tex => { uniforms[k].value = tex; });
      } else {
        uniforms[k] = { value: u.value };
      }
    }
    if (!uniforms['time']) uniforms['time'] = { value: 0 };
    const blending = (comp as any).blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending;
    const vertex = comp.vertexShader ?? `uniform float time; varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
    const fragment = comp.fragmentShader ?? `uniform float time; varying vec2 vUv; void main(){ gl_FragColor=vec4(1.0); }`;
    return new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: comp.transparent, depthWrite: (comp as any).depthWrite, blending });
  }

  private createMesh(entity: Entity, geometryComp: GeometryComponent, materialComp?: MaterialComponent, shaderMaterialComp?: ShaderMaterialComponent): void {
    const geometry = this.buildGeometry(geometryComp.parameters);
    let material: THREE.Material;
    if (shaderMaterialComp) material = this.buildShaderMaterial(shaderMaterialComp)!; else material = this.buildMaterial(materialComp)!;
    const mesh = new THREE.Mesh(geometry, material);
    this.syncTransformToObject3D(entity, mesh);
    this.scene.add(mesh);
    this.renderComponents.set(entity.id, { entityId: entity.id, object3D: mesh, geometry, material });
  }

  private createCamera(entity: Entity, cameraView: CameraViewComponent): void {
    const camera = new THREE.PerspectiveCamera(cameraView.fov, cameraView.aspect, cameraView.near, cameraView.far);
    this.syncTransformToObject3D(entity, camera);
    this.renderComponents.set(entity.id, { entityId: entity.id, object3D: camera });
  }

  private recreateMesh(entity: Entity): void {
    const rc = this.renderComponents.get(entity.id);
    if (rc?.object3D) { this.scene.remove(rc.object3D); if (rc.geometry) rc.geometry.dispose(); if (rc.material) rc.material.dispose(); }
    const geometry = entity.getComponent<GeometryComponent>('geometry');
    const material = entity.getComponent<MaterialComponent>('material');
    const shaderMaterial = entity.getComponent<ShaderMaterialComponent>('shaderMaterial');
    if (geometry && (material || shaderMaterial)) this.createMesh(entity, geometry, material, shaderMaterial);
  }

  private syncMaterial(entity: Entity): void {
    const rc = this.renderComponents.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;
    const materialComp = entity.getComponent<MaterialComponent>('material'); if (!materialComp) return;
    if (rc.material) rc.material.dispose();
    const newMat = this.buildMaterial(materialComp)!; rc.object3D.material = newMat; rc.material = newMat;
  }

  private syncCamera(entity: Entity): void {
    const rc = this.renderComponents.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.PerspectiveCamera)) return;
    const cv = entity.getComponent<CameraViewComponent>('cameraView'); if (!cv) return;
    rc.object3D.fov = cv.fov; rc.object3D.aspect = cv.aspect; rc.object3D.near = cv.near; rc.object3D.far = cv.far; rc.object3D.updateProjectionMatrix();
  }

  private recreateLight(entity: Entity): void {
    const rc = this.renderComponents.get(entity.id);
    if (rc?.object3D) this.scene.remove(rc.object3D);
    const lightComp = entity.getComponent<LightComponent>('light'); if (lightComp) this.createLight(entity, lightComp);
  }

  private onTransformChanged(entityId: string): void {
    const entity = this.entities.get(entityId); if (!entity) return;
    const rc = this.renderComponents.get(entityId); if (!rc?.object3D) return;
    this.syncTransformToObject3D(entity, rc.object3D);
    if (rc.object3D instanceof THREE.DirectionalLight || rc.object3D instanceof THREE.SpotLight) {
      const light = rc.object3D as THREE.DirectionalLight | THREE.SpotLight;
      const forward = entity.transform.getForward();
      const targetPos = new THREE.Vector3().copy(entity.transform.worldPosition).add(forward.multiplyScalar(10));
      light.target.position.copy(targetPos);
    }
  }

  private syncTransformToObject3D(entity: Entity, object3D: THREE.Object3D): void {
    const t = entity.transform; object3D.position.copy(t.worldPosition); object3D.rotation.copy(t.worldRotation); object3D.scale.copy(t.worldScale);
  }

  update(dt: number): void {
    for (const [id, rc] of this.renderComponents) {
      const entity = this.entities.get(id); if (!entity) continue;
      const shaderMatComp = entity.getComponent<ShaderMaterialComponent>('shaderMaterial');
      if (shaderMatComp && rc.object3D instanceof THREE.Mesh) {
        const material = rc.object3D.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          if (material.uniforms.time) material.uniforms.time.value += dt;
          for (const [key, uni] of Object.entries(shaderMatComp.uniforms)) {
            if (material.uniforms[key]) material.uniforms[key].value = uni.value;
          }
        }
      }
    }
  }

  private createLight(entity: Entity, lightComp: LightComponent): void {
    const p = lightComp.params; let light: THREE.Light;
    switch (p.type) {
      case 'ambient': light = new THREE.AmbientLight(p.color as any ?? 0xffffff, p.intensity ?? 0.5); break;
      case 'directional': {
        const dir = new THREE.DirectionalLight(p.color as any ?? 0xffffff, p.intensity ?? 1.0);
        const forward = entity.transform.getForward();
        const targetPos = new THREE.Vector3().copy(entity.transform.worldPosition).add(forward.multiplyScalar(10));
        dir.position.copy(entity.transform.worldPosition); dir.target.position.copy(targetPos); this.scene.add(dir.target); light = dir; break; }
      case 'point': {
        const point = new THREE.PointLight(p.color as any ?? 0xffffff, p.intensity ?? 1.0, (p as any).distance ?? 0, (p as any).decay ?? 1);
        point.position.copy(entity.transform.worldPosition); light = point; break; }
      case 'spot': {
        const spot = new THREE.SpotLight(p.color as any ?? 0xffffff, p.intensity ?? 1.0, (p as any).distance ?? 0, (p as any).angle ?? Math.PI/6, (p as any).penumbra ?? 0.0, (p as any).decay ?? 1);
        spot.position.copy(entity.transform.worldPosition); const forward = entity.transform.getForward(); const targetPos = new THREE.Vector3().copy(entity.transform.worldPosition).add(forward.multiplyScalar(10)); spot.target.position.copy(targetPos); this.scene.add(spot.target); light = spot; break; }
      default: light = new THREE.AmbientLight(0xffffff, 0.3); break;
    }
    this.scene.add(light);
    this.renderComponents.set(entity.id, { entityId: entity.id, object3D: light });
  }
}

export default RenderSyncSystem;