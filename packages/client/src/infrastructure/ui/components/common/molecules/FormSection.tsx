import { ComponentChildren } from "preact";
import "./form-section.css";

type FormSectionProps = {
  title: string;
  children: ComponentChildren;
};

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="sd-form-section">
      <h3 className="sd-form-section__title">{title}</h3>
      <div className="sd-form-section__content">{children}</div>
    </div>
  );
}
