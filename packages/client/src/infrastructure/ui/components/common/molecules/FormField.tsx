import { ComponentChildren } from "preact";
import "./form-field.css";

type FormFieldProps = {
  label: string;
  children: ComponentChildren;
  htmlFor?: string;
};

export function FormField({ label, children, htmlFor }: FormFieldProps) {
  return (
    <div className="sd-form-field">
      <label className="sd-form-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="sd-form-field__control">{children}</div>
    </div>
  );
}
