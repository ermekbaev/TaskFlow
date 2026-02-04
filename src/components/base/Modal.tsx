'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity backdrop-blur-sm" onClick={onClose}>
          <div className="absolute inset-0 bg-ink/40"></div>
        </div>

        <div className={`inline-block w-full ${sizeClasses[size]} p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-elevated rounded-2xl border border-surface-200`}>
          <div className="flex items-center justify-between mb-6">
            {title && <h3 className="text-xl font-bold text-ink">{title}</h3>}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-ink-light hover:text-ink hover:bg-surface-100 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
