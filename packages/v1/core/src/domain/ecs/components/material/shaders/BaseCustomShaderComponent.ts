import { BaseMaterialComponent } from "../BaseMaterialComponent";

export interface ShaderUniform {
    value: any;
    type: "float" | "vec2" | "vec3" | "vec4" | "color" | "texture";
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    description?: string;
}

export abstract class BaseCustomShaderComponent extends BaseMaterialComponent {
    private _shaderId: string;
    private _uniforms: Record<string, ShaderUniform>;
    private _transparent: boolean;
    private _depthWrite: boolean;
    private _blending: string;

    constructor(params: {
        shaderId: string;
        uniforms?: Record<string, ShaderUniform>;
        transparent?: boolean;
        depthWrite?: boolean;
        blending?: string;
    }) {
        super();
        this._shaderId = params.shaderId;
        this._uniforms = params.uniforms ?? {};
        this._transparent = params.transparent ?? true;
        this._depthWrite = params.depthWrite ?? false;
        this._blending = params.blending ?? "normal";
    }

    get shaderId(): string {
        return this._shaderId;
    }

    set shaderId(v: string) {
        this._shaderId = v;
        this.notifyChanged();
    }

    get uniforms(): Record<string, ShaderUniform> {
        return this._uniforms;
    }

    set uniforms(u: Record<string, ShaderUniform>) {
        this._uniforms = u;
        this.notifyChanged();
    }

    get transparent(): boolean {
        return this._transparent;
    }

    set transparent(v: boolean) {
        this._transparent = v;
        this.notifyChanged();
    }

    get depthWrite(): boolean {
        return this._depthWrite;
    }

    set depthWrite(v: boolean) {
        this._depthWrite = v;
        this.notifyChanged();
    }

    get blending(): string {
        return this._blending;
    }

    set blending(v: string) {
        this._blending = v;
        this.notifyChanged();
    }

    setUniform(name: string, value: any, type?: ShaderUniform["type"]): void {
        if (this._uniforms[name]) {
            this._uniforms[name].value = value;
            if (type) this._uniforms[name].type = type;
            this.notifyChanged();
        } else {
            this._uniforms[name] = {
                value,
                type: type ?? "float"
            };
            this.notifyChanged();
        }
    }

    setUniforms(uniforms: Record<string, any>): void {
        let changed = false;
        for (const [n, val] of Object.entries(uniforms)) {
            const isObject = val && typeof val === 'object' && 'value' in val;
            const finalValue = isObject ? (val as any).value : val;
            const finalType = isObject ? (val as any).type : undefined;

            if (this._uniforms[n]) {
                this._uniforms[n].value = finalValue;
                if (finalType) this._uniforms[n].type = finalType;
                changed = true;
            } else {
                this._uniforms[n] = {
                    value: finalValue,
                    type: finalType ?? "float"
                };
                changed = true;
            }
        }
        if (changed) this.notifyChanged();
    }
}
