import { h, ComponentChildren } from 'preact';
import './card.css';

export interface CardProps {
  children: ComponentChildren;
  className?: string;
  variant?: 'default' | 'small' | 'panel';
  clickable?: boolean;
  as?: keyof JSX.IntrinsicElements;
  // allow any other html attrs
  [key: string]: any;
}

export function Card({ as = 'div', className = '', variant = 'default', clickable = false, children, ...rest }: CardProps) {
  const Tag = as as any;
  const cls = ['sd-card', `sd-card--${variant}`, clickable ? 'sd-card--clickable' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}

export default Card;
