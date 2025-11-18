import type { ComponentChildren } from 'preact';

type EntityIconProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function EntityIcon({ size = 14, className = '', title = 'Entity' }: EntityIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <title>{title}</title>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="12" r="1.2" fill="currentColor" />
      <path d="M10 11.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
