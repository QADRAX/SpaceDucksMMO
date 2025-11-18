import { ComponentChildren } from "preact";
import { useState, useEffect } from "preact/hooks";
import "./popup.css";

type PopupProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ComponentChildren;
  footer?: ComponentChildren;
  maxWidth?: string;
};

export function Popup({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "600px",
}: PopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className={`popup-overlay ${isClosing ? 'popup-overlay--closing' : ''}`} 
      onClick={onClose}
    >
      <div
        className={`popup-content ${isClosing ? 'popup-content--closing' : ''}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="popup-header">
            <h2 className="popup-title">{title}</h2>
            <button className="popup-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        )}

        <div className="popup-body">{children}</div>

        {footer && <div className="popup-footer">{footer}</div>}
      </div>
    </div>
  );
}
