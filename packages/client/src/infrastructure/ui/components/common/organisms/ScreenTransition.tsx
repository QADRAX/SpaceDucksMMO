/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import './screen-transition.css';

export interface ScreenTransitionProps {
  isTransitioning: boolean;
  duration?: number;
}

export function ScreenTransition({ isTransitioning, duration = 300 }: ScreenTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, duration]);

  if (!isVisible) return null;

  return (
    <div 
      class={`screen-transition ${isTransitioning ? 'fade-in' : 'fade-out'}`}
      style={{ '--transition-duration': `${duration}ms` } as any}
    />
  );
}

