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
  // The dialog is bounded to the viewport (max-h-[90vh]) and the body
  // scrolls internally (overflow-y-auto), so a tall form can never push
  // the title, submit button, or Close button off-screen. The header and
  // footer stay fixed while only the middle scrolls.
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        data-testid="modal-dialog"
        className="bg-white rounded-xl w-full max-w-lg shadow-lg max-h-[90vh] flex flex-col"
      >
        {/* Optional title — always visible */}
        {title && (
          <h2 className="shrink-0 px-6 pt-6 pb-4 text-xl font-bold">{title}</h2>
        )}

        {/* Modal content — scrolls inside the viewport-bounded dialog */}
        <div data-testid="modal-scroll" className="flex-1 overflow-y-auto px-6">
          {children}
        </div>

        {/* Close button — always visible in the footer */}
        <div className="shrink-0 px-6 py-4 text-right border-t border-gray-100">
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
