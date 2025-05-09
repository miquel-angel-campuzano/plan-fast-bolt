import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type ToastProps = {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
};

export function Toast({
  message,
  show,
  onClose,
  duration = 3000
}: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div
      className="
        fixed bottom-24 right-8 
        bg-neutral-700 text-neutral-100 
        px-6 py-3 rounded-lg shadow-lg
        flex items-center gap-3 
        animate-fade-in z-50
      "
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="
          text-neutral-300 
          hover:text-neutral-100 
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        "
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
