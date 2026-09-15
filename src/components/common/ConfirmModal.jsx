import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  title = 'Silməyə əminsiniz?',
  message = 'Bu əməliyyat geri qaytarılmaya bilər.',
  confirmText = 'Bəli, sil',
  cancelText = 'Ləğv et',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={onCancel}>
          <X size={18} />
        </button>

        <div className="confirm-modal-icon">
          <Trash2 size={32} />
        </div>

        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>

        <div className="confirm-modal-actions">
          <button className="confirm-modal-cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-modal-delete-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

