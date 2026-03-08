import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-l-emerald-500 text-emerald-500',
  error: 'border-l-red-500 text-red-500',
  warning: 'border-l-amber-500 text-amber-500',
  info: 'border-l-blue-500 text-blue-500',
};

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2 max-w-100 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  };
  onClose: () => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { type, message, duration = 5000 } = notification;
  const Icon = icons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 p-3.5 bg-dev-surface rounded-lg shadow-lg border-l-4 ${colors[type]} pointer-events-auto`}
    >
      <div className="shrink-0">
        <Icon size={20} />
      </div>
      <p className="flex-1 m-0 text-sm text-dev-text leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 flex items-center justify-center w-6 h-6 rounded hover:bg-dev-hover text-dev-text-muted hover:text-dev-text transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
