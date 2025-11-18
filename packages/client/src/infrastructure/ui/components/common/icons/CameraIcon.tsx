type IconProps = { size?: number; color?: string; className?: string };

export function CameraIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7h3l2-2h6l2 2h3v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export default CameraIcon;
