type IconProps = { size?: number; color?: string; className?: string };

export function SceneIcon({ size = 16, color = 'currentColor', className = '' }: IconProps) {
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
      <path d="M3 6h18v12H3z" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12h12" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <circle cx="18" cy="8" r="1.2" fill={color} />
    </svg>
  );
}

export default SceneIcon;
