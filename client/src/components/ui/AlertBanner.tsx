// Inline banner component for displaying key system warnings or trade success messages
import React from 'react'

interface AlertBannerProps {
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  onClose?: () => void
  className?: string
}

export function AlertBanner({ message, type = 'info', onClose, className = '' }: AlertBannerProps) {
  const styles = {
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  return (
    <div className={`p-4 rounded-lg border flex items-center justify-between text-sm ${styles[type]} ${className}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 hover:opacity-75 transition-opacity text-xs font-semibold focus:outline-none"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
export default AlertBanner
