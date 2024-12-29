import React from 'react';
import { Copy } from 'lucide-react';

interface ToastDescriptionProps {
  message: string;
}

export const ToastDescription: React.FC<ToastDescriptionProps> = ({ message }) => {
  return (
    <div className="flex items-center gap-2">
      <span>{message}</span>
      <button
        onClick={() => navigator.clipboard.writeText(message)}
        className="hover:text-primary"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
};