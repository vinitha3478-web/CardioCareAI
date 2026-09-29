import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = "success", onClose }) => {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={20} color="#38a169" />,
    error: <XCircle size={20} color="#e53e3e" />,
    warning: <AlertTriangle size={20} color="#dd6b20" />,
    info: <Info size={20} color="#6c47ff" />
  };

  return (
    <div className={`toast-banner toast-${type} neu-card-flat`}>
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-message">{message}</div>
      {onClose && (
        <button className="toast-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
