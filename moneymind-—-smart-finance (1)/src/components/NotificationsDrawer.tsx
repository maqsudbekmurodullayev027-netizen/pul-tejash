import React from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { AppNotification } from '../types/finance';

interface NotificationsDrawerProps {
  isOpen: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
  onMarkRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const getIcon = (level: AppNotification['level']) => {
    switch (level) {
      case 'danger':
        return <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Info className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Bildirishnomalar va ogohlantirishlar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-2.5 text-xs dark:border-slate-800/80">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            Barchasini o'qilgan deb belgilash
          </button>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                Bildirishnomalar yo'q
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Byudjet limitlari, jamg'arma sur'ati va xavfli xarajatlar haqidagi
                ogohlantirishlar shu yerda ko'rinadi.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`cursor-pointer px-6 py-4 transition-colors ${
                  n.read
                    ? 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/40'
                    : 'bg-teal-50/40 hover:bg-teal-50/70 dark:bg-teal-950/20 dark:hover:bg-teal-950/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getIcon(n.level)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600 dark:bg-teal-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {n.message}
                    </p>
                    <p className="font-mono-num mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                      {n.createdAt.replace('T', ' · ').slice(0, 18)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface ToastAlertStackProps {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
}

export const ToastAlertStack: React.FC<ToastAlertStackProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const tone =
          toast.level === 'danger'
            ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
            : toast.level === 'warning'
            ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'
            : toast.level === 'success'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
            : 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-150 ${tone}`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.level === 'danger' ? (
                <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : toast.level === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : toast.level === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Info className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold">{toast.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded p-1 opacity-70 hover:opacity-100"
              aria-label="Yopish"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
