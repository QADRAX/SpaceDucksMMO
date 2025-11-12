import { ComponentChildren } from "preact";
import "./list.css";

type ListProps = {
  children: ComponentChildren;
  emptyMessage?: string;
};

export default function List({ children, emptyMessage = "No items" }: ListProps) {
  const hasChildren = children && (Array.isArray(children) ? children.length > 0 : true);

  if (!hasChildren && emptyMessage) {
    return (
      <div className="sd-list-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return <div className="sd-list">{children}</div>;
}
