// src/components/ui/Modal.tsx
import React, { createContext, useState } from 'react';

/**
 * The DOM node of the modal's fixed footer, shared with modal children
 * that need an action always visible (e.g. a form's submit/cancel).
 * A child renders its actions into it with createPortal; when the
 * context is null — the child is rendered outside a Modal, or the footer
 * has not mounted yet — the child falls back to rendering inline.
 */
export const ModalFooterContext = createContext<HTMLElement | null>(null);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // The footer element, captured via ref so children can portal actions
  // into it. The ref callback's setState re-renders once mounted so the
  // context value is available to children.
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

  // --------------------------- Visibility Guard ---------------------------
  if (!isOpen) return null;

  // --------------------------- Render ---------------------------
  // The dialog is bounded to the viewport (max-h-[90vh]) and the body
  // scrolls internally (overflow-y-auto), so a tall form can never push
  // the title or the footer actions off-screen. The header and footer
  // stay fixed while only the middle scrolls.
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
        <ModalFooterContext.Provider value={footerEl}>
          <div data-testid="modal-scroll" className="flex-1 overflow-y-auto px-6">
            {children}
          </div>
        </ModalFooterContext.Provider>

        {/* Fixed footer — always visible. Holds the Close button plus any
            actions a child portals in (e.g. a form's submit/cancel). */}
        <div
          data-testid="modal-footer"
          ref={setFooterEl}
          className="shrink-0 px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2"
        >
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
