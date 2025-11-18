import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import DevRegistry from '@client/infrastructure/ui/dev/DevRegistry';
import type { DevWidget } from '@client/infrastructure/ui/dev/DevWidget';

type Props = { registry: DevRegistry };

export function DevOverlay({ registry }: Props) {
  const [widgets, setWidgets] = useState<DevWidget[]>(registry.getWidgets());

  useEffect(() => {
    // naive polling for registry changes; registry is small and only for dev tools
    const id = setInterval(() => setWidgets(registry.getWidgets()), 250);
    return () => clearInterval(id);
  }, [registry]);

  return (
    <div
      className="dev-overlay"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 10000, pointerEvents: 'none' }}
    >
      {widgets.map((w) => (
        // w.render returns a vnode
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        <div
          key={w.id}
          className={`dev-widget dev-widget-${w.id}`}
          style={{ pointerEvents: 'auto' }}
        >
          {w.render()}
        </div>
      ))}
    </div>
  );
}

export default DevOverlay;
