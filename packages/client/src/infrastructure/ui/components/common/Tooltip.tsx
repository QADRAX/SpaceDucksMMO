import { ComponentChildren } from "preact";
import "./tooltip.css";

type TooltipProps = {
  children: ComponentChildren;
  visible: boolean;
  position?: "top" | "bottom" | "left" | "right";
};

export default function Tooltip({ children, visible, position = "top" }: TooltipProps) {
  if (!visible) return null;

  return (
    <div className={`sd-tooltip sd-tooltip--${position}`}>
      {children}
    </div>
  );
}
