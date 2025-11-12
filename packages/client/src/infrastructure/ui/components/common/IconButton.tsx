import "./icon-button.css";

type IconButtonProps = {
  icon: string;
  onClick?: (e: MouseEvent) => void;
  title?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
};

export default function IconButton({
  icon,
  onClick,
  title,
  variant = "secondary",
  size = "medium",
  disabled = false,
}: IconButtonProps) {
  const classes = [
    "sd-icon-button",
    `sd-icon-button--${variant}`,
    `sd-icon-button--${size}`,
  ].join(" ");

  return (
    <button
      className={classes}
      onClick={onClick as any}
      title={title}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
