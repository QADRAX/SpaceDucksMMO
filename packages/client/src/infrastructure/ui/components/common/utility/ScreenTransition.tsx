/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import './screen-transition.css';

export interface ScreenTransitionProps {
  isTransitioning: boolean;
  duration?: number;
}

/**
 * Full-screen overlay for smooth transitions between game screens.
 * Fades to black during scene changes to hide loading artifacts.
 */
export function ScreenTransition({ isTransitioning, duration = 300 }: ScreenTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setIsVisible(true);
    } else {
      // Keep visible during fade-out
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

export default ScreenTransition;
