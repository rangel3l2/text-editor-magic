import React from 'react';

interface ToastDescriptionProps {
  message: string;
}

export const ToastDescription: React.FC<ToastDescriptionProps> = ({ message }) => {
  return (
    <div className="flex items-center gap-2">
      {message}
    </div>
  );
};