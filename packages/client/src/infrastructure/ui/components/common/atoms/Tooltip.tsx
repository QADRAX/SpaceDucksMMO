import { ComponentChildren } from "preact";
import "./tooltip.css";

type TooltipProps = {
  children: ComponentChildren;
  visible: boolean;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
};

export function Tooltip({ children, visible, position = "top", className = "" }: TooltipProps) {
  if (!visible) return null;

  return (
    <div className={`sd-tooltip sd-tooltip--${position} ${className}`.trim()}>
      {children}
    </div>
  );
}
