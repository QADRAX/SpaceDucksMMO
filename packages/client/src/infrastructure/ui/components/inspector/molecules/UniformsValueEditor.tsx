import { TextureSelector } from "./TextureSelector";
import { PropertyReadonly } from "../../common/atoms/PropertyReadonly";

export type UniformsValueEditorProps = {
  uniforms: Record<string, any>;
  onChange: (name: string, value: any) => void;
  notifyChanged?: () => void;
};

export function UniformsValueEditor({
  uniforms,
  onChange,
  notifyChanged,
}: UniformsValueEditorProps) {
  return (
    <div style={{ paddingLeft: 8 }}>
      {Object.keys(uniforms).map((uname) => {
        const u = uniforms[uname];
        return (
          <div className="prop-row" key={uname}>
            <div className="prop-key">{uname}</div>
            <div className="prop-value">
              {u && u.type === "texture" ? (
                <TextureSelector
                  value={u.value || null}
                  onChange={(tx) => {
                    u.value = tx || null;
                    onChange(uname, u.value);
                    notifyChanged && notifyChanged();
                  }}
                />
              ) : (
                <PropertyReadonly value={u?.value} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
