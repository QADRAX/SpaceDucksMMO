import { PhysicalShaderMaterialComponent } from '@duckengine/ecs';
import { BaseShaderPreviewScene } from './BaseShaderPreviewScene';

export class PhysicalShaderPreviewScene extends BaseShaderPreviewScene {
    readonly id = 'admin-physical-shader-preview';
    readonly shaderComponentType = 'physicalShaderMaterial';

    protected createShaderComponent() {
        return new PhysicalShaderMaterialComponent({
            shaderId: this.shaderId,
            uniforms: this.initialUniforms ?? {},
            ...(this.initialComponentData ?? {})
        });
    }
}
