/** @jsxImportSource preact */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { ScreenTransition } from "./components/common/organisms/ScreenTransition";
import type { GameScreenManager } from "@client/application/ui/GameScreenManager";

export interface RootAppProps {
  gameScreenManager: GameScreenManager;
  children: any;
}

/**
 * Root application component that wraps all screens and provides transition overlay
 */
export function RootApp({ gameScreenManager, children }: RootAppProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Subscribe to transition events
    const unsubscribe = gameScreenManager.onTransition((transitioning) => {
      setIsTransitioning(transitioning);
    });

    return () => unsubscribe();
  }, [gameScreenManager]);

  return (
    <>
      {children}
      <ScreenTransition isTransitioning={isTransitioning} duration={300} />
    </>
  );
}

export default RootApp;
