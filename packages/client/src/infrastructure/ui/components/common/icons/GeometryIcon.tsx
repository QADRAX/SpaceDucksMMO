type IconProps = { size?: number; color?: string; className?: string };

export function GeometryIcon({ size = 14, color = 'currentColor', className = '' }: IconProps) {
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
      <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth={1.3} />
      <path d="M3 10h18" stroke={color} strokeWidth={1} strokeLinecap="round" />
    </svg>
  );
}

export default GeometryIcon;
