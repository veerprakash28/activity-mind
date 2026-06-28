'use client';

import { useAppContext } from '@/context/AppContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'confirm' | 'info';

interface StatusModalProps {
  visible: boolean;
  type: StatusType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function StatusModal({
  visible, type, title, message,
  confirmLabel = 'OK', cancelLabel = 'Cancel',
  onConfirm, onClose
}: StatusModalProps) {
  const { theme } = useAppContext();

  if (!visible) return null;

  const iconMap = {
    success: { icon: CheckCircle, color: theme.colors.success, bg: theme.colors.success + '15' },
    error: { icon: AlertCircle, color: theme.colors.error, bg: theme.colors.error + '15' },
    confirm: { icon: AlertTriangle, color: theme.colors.warning, bg: theme.colors.warning + '15' },
    info: { icon: Info, color: theme.colors.primary, bg: theme.colors.primaryLight },
  };

  const { icon: Icon, color, bg } = iconMap[type];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>
          <X size={18} />
        </button>

        <div className="status-modal-icon" style={{ background: bg }}>
          <Icon size={32} color={color} />
        </div>

        <h3 className="status-modal-title">{title}</h3>
        <p className="status-modal-message">{message}</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {type === 'confirm' && (
            <button className="btn btn-outline" onClick={onClose}>
              {cancelLabel}
            </button>
          )}
          <button
            className={`btn ${type === 'confirm' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
