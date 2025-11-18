import { ComponentChildren } from "preact";
import "./list.css";

type ListItemProps = {
  children: ComponentChildren;
  onClick?: () => void;
  hover?: boolean;
};

export function ListItem({ children, onClick, hover = true }: ListItemProps) {
  return (
    <div
      className={`sd-list-item ${hover ? "sd-list-item--hover" : ""} ${onClick ? "sd-list-item--clickable" : ""}`}
      onClick={() => onClick && onClick()}
    >
      {children}
    </div>
  );
}
