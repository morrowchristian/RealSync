// src/components/ui/ConfirmDialog.tsx
// In-app confirmation step for destructive actions (archive / delete).
// Deliberately NOT window.confirm: native confirm dialogs are
// auto-dismissed as Cancel in automated browsers, so handlers gated
// behind them silently do nothing. Render this inline where the action
// is triggered and drive it with React state instead.

interface ConfirmDialogProps {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** 'danger' (red) for deletes, 'warn' (orange) for archives. */
  variant?: 'danger' | 'warn';
}

export default function ConfirmDialog({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const confirmClass =
    variant === 'warn'
      ? 'bg-orange-500 hover:bg-orange-600'
      : 'bg-red-600 hover:bg-red-700';

  return (
    <div
      role="alertdialog"
      aria-label="Confirm action"
      className="p-4 bg-amber-50 border border-amber-300 rounded"
    >
      <p className="text-sm text-gray-800">{message}</p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-white rounded ${confirmClass}`}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
