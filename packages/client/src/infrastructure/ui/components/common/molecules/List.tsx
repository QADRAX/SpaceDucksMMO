import { ComponentChildren } from "preact";
import "./list.css";

type ListProps = {
  children: ComponentChildren;
  emptyMessage?: string;
  className?: string;
};

export function List({ children, emptyMessage = "No items", className = "" }: ListProps) {
  const hasChildren = children && (Array.isArray(children) ? children.length > 0 : true);

  // extract className if passed via props
  // (kept separate to avoid changing callers)

  if (!hasChildren && emptyMessage) {
    return (
      <div className={`sd-list-empty ${className}`.trim()}>{/* no children */}
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return <div className={`sd-list ${className}`.trim()}>{children}</div>;
}
