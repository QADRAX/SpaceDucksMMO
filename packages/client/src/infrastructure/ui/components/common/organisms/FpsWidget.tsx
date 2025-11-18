import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { FpsController } from '@client/infrastructure/ui/dev/FpsController';
import type { DevWidgetController, FpsChange } from '@client/infrastructure/ui/dev/DevWidgetController';

type Props = {
  controller: FpsController;
  updateIntervalMs?: number;
  style?: any;
};

export function FpsWidget({ controller, updateIntervalMs = 500, style }: Props) {
  const [fps, setFps] = useState<number>(controller.getFps());
  const [running, setRunning] = useState<boolean>(controller.isRunning());
  const ctrl = controller as unknown as DevWidgetController<FpsChange>;
  const [visible, setVisible] = useState<boolean>(ctrl.isVisible ? ctrl.isVisible() : true);

  useEffect(() => {
    const unsubChange = ctrl.onChange((c: FpsChange) => {
      if (c.visible !== undefined) setVisible(Boolean(c.visible));
      if (c.running !== undefined) setRunning(Boolean(c.running));
      if (c.fps !== undefined) setFps(Number(c.fps));
    });

    return () => { unsubChange(); };
  }, []);

  const baseStyle: any = {
    position: 'fixed',
    top: '10px',
    left: '10px',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    borderRadius: '4px',
    zIndex: 10000,
    pointerEvents: 'none',
    userSelect: 'none',
    ...style,
  };

  if (!visible) return null;

  return (
    <div className="dev-fps-widget" style={baseStyle}>
      FPS: {fps} {running ? '' : '(stopped)'}
    </div>
  );
}

