import { StandardShaderMaterialComponent } from '@duckengine/ecs';
import { BaseShaderPreviewScene } from './BaseShaderPreviewScene';

export class StandardShaderPreviewScene extends BaseShaderPreviewScene {
    readonly id = 'admin-standard-shader-preview';
    readonly shaderComponentType = 'standardShaderMaterial';

    protected createShaderComponent() {
        return new StandardShaderMaterialComponent({
            shaderId: this.shaderId,
            uniforms: this.initialUniforms ?? {},
            ...(this.initialComponentData ?? {})
        });
    }
}
