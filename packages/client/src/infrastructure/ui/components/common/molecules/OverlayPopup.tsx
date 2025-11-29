import { h } from 'preact';
import { useEffect } from 'preact/hooks';

type Props = {
  open: boolean;
  onClose: () => void;
  width?: number | string;
  children?: any;
  className?: string;
};

export default function OverlayPopup({ open, onClose, width = 420, children, className = '' }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="create-entity-overlay" role="dialog" aria-modal="true" onClick={(e) => {
      // close when clicking backdrop
      if ((e.target as Element).classList.contains('create-entity-overlay')) onClose();
    }}>
      <div className={`create-entity-popup ${className}`} style={{ width, maxHeight: '70vh', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
