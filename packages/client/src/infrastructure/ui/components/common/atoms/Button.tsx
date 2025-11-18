import "./button.css";
import type { ComponentChildren } from 'preact';

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize = "small" | "medium" | "large";

type ButtonProps = {
  children: ComponentChildren;
  onClick?: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
};

export function Button({
  children,
  onClick,
  className = "",
  disabled = false,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  type = "button",
}: ButtonProps) {
  const classes = [
    "sd-button",
    `sd-button--${variant}`,
    `sd-button--${size}`,
    fullWidth && "sd-button--full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
