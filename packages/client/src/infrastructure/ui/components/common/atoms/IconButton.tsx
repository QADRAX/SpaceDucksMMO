import "./icon-button.css";
import type { ComponentChildren } from "preact";

type IconButtonProps = {
  icon: ComponentChildren;
  onClick?: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;
  title?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  className?: string;
};

export function IconButton({
  icon,
  onClick,
  title,
  variant = "secondary",
  size = "medium",
  disabled = false,
  className = "",
}: IconButtonProps) {
  const classes = [
    "sd-icon-button",
    `sd-icon-button--${variant}`,
    `sd-icon-button--${size}`,
    className,
  ].join(" ");

  return (
    <button
      className={classes}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
