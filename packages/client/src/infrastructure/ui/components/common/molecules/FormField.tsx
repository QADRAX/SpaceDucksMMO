import { ComponentChildren } from "preact";

type FormFieldProps = {
  label: string;
  children: ComponentChildren;
  htmlFor?: string;
  className?: string;
};

export function FormField({ label, children, htmlFor, className = "" }: FormFieldProps) {
  return (
    <div className={`sd-form-field ${className}`.trim()}>
      <label className="sd-form-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="sd-form-field__control">{children}</div>
    </div>
  );
}
