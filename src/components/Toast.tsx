import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform lg:bottom-8">
      <div className="flex items-center gap-2 rounded-lg border border-[#c9a84c] bg-[#111111] px-4 py-3 shadow-lg">
        <Check className="h-4 w-4 text-[#22c55e]" />
        <span className="text-sm font-medium text-white">{message}</span>
      </div>
    </div>
  );
}
