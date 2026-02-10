import * as React from 'react';

import { cn } from '@/lib/utils';

type Props = {
  header?: React.ReactNode;
  leading?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  left: React.ReactNode;
  right: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function ResourceDetailShell({
  header,
  leading,
  title,
  subtitle,
  actions,
  left,
  right,
  footer,
  className,
}: Props) {
  return (
    <div className={cn('h-full min-h-0 w-full flex flex-col gap-4', className)}>
      <header className="shrink-0 rounded-base border-2 border-border bg-white shadow-base px-6 py-4">
        {header ? (
          header
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex items-start gap-4">
              {leading ? <div className="shrink-0">{leading}</div> : null}
              <div className="min-w-0">
                <div className="text-xl font-heading truncate">{title}</div>
                {subtitle ? <div className="text-sm text-neutral-600 mt-1 wrap-break-word">{subtitle}</div> : null}
              </div>
            </div>
            {actions ? <div className="shrink-0 flex items-center gap-2">{actions}</div> : null}
          </div>
        )}
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(380px,520px)_1fr] gap-4">
        <section className="min-h-0 rounded-base border-2 border-border bg-white shadow-base overflow-hidden">
          <div className="h-full min-h-0 overflow-auto scrollbar p-6">{left}</div>
        </section>

        <section className="min-h-0 rounded-base border-2 border-border bg-white shadow-base overflow-hidden">
          <div className="h-full min-h-0 overflow-hidden">{right}</div>
        </section>
      </div>

      {footer ? (
        <footer className="shrink-0 rounded-base border-2 border-border bg-white shadow-base px-6 py-3">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
