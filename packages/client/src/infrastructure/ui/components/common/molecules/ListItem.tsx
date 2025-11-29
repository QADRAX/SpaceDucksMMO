import { ComponentChildren } from "preact";
import { Card } from "../atoms/Card";
import "./list.css";

type ListItemProps = {
  children: ComponentChildren;
  onClick?: () => void;
  hover?: boolean;
  className?: string;
};

export function ListItem({ children, onClick, hover = true, className = '' }: ListItemProps) {
  return (
    <Card
      as="div"
      className={`sd-list-item ${hover ? "sd-list-item--hover" : ""} ${onClick ? "sd-list-item--clickable" : ""} ${className}`}
      clickable={!!onClick}
      onClick={() => onClick && onClick()}
    >
      {children}
    </Card>
  );
}
