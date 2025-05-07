// src/components/ui/Modal.tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // --------------------------- Visibility Guard ---------------------------
  if (!isOpen) return null;

  // --------------------------- Render ---------------------------
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded p-6 w-full max-w-lg shadow-lg">
        {/* Optional title */}
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}

        {/* Modal content */}
        {children}

        {/* Close button */}
        <div className="text-right mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
