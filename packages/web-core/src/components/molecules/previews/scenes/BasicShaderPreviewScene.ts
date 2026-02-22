import { BasicShaderMaterialComponent } from '@duckengine/ecs';
import { BaseShaderPreviewScene } from './BaseShaderPreviewScene';

export class BasicShaderPreviewScene extends BaseShaderPreviewScene {
    readonly id = 'admin-basic-shader-preview';
    readonly shaderComponentType = 'basicShaderMaterial';

    protected createShaderComponent() {
        return new BasicShaderMaterialComponent({
            shaderId: this.shaderId,
            uniforms: this.initialUniforms ?? {},
            ...(this.initialComponentData ?? {})
        });
    }
}
