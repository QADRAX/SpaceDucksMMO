'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  closeOnSelect?: boolean;
}

export function DropdownMenu({ trigger, children, align = 'right', closeOnSelect = true }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0, right: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        right: window.innerWidth - rect.right - window.scrollX,
      });
    }
  }, [open]);

  const handleToggle = () => {
    setOpen(!open);
  };

  return (
    <>
      <div className="relative inline-block" ref={triggerRef}>
        <div onClick={handleToggle}>
          {trigger}
        </div>
      </div>
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className={cn(
            'fixed min-w-45 bg-white border-2 border-black rounded-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-9999',
          )}
          style={{
            top: `${position.top}px`,
            ...(align === 'right'
              ? { right: `${position.right}px` }
              : { left: `${position.left}px` }
            ),
          }}
        >
          <div className="py-1" onClick={() => closeOnSelect && setOpen(false)}>
            {children}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

interface DropdownMenuItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  asChild?: boolean;
  className?: string;
}

export function DropdownMenuItem({
  onClick,
  children,
  variant = 'default',
  asChild = false,
  className
}: DropdownMenuItemProps) {
  const baseClassName = cn(
    'w-full text-left px-4 py-2 font-bold text-sm hover:bg-gray-100 transition-colors border-none cursor-pointer block',
    variant === 'danger' && 'text-red-600 hover:bg-red-50',
    className
  );

  if (asChild) {
    // If asChild, wrap children and apply className to child
    return (
      <div className={baseClassName} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={baseClassName}
    >
      {children}
    </button>
  );
}
