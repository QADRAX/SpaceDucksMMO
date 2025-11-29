type IconProps = { size?: number; color?: string; className?: string };

export function EntityIcon({ size = 12, color = 'currentColor', className = '' }: IconProps) {
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
      <circle cx="12" cy="8" r="2.5" stroke={color} strokeWidth={1.2} />
      <path d="M5 20c1.5-4 5-6 7-6s5.5 2 7 6" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default EntityIcon;
