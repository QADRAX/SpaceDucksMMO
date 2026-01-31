import * as React from 'react';
import { cn } from '@/lib/utils';

const Tag = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-base border-2 border-border bg-bg px-2 py-1 text-xs font-medium text-text shadow-base',
        className
      )}
      {...props}
    />
  );
});
Tag.displayName = 'Tag';

export { Tag };
