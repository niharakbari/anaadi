import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Toast ────────────────────────────────────────────────────────────────────
const toastConfig = {
  success: {
    icon:    CheckCircle2,
    classes: 'border-green-200 bg-white',
    iconClass: 'text-success',
    barClass:  'bg-success',
  },
  error: {
    icon:    XCircle,
    classes: 'border-red-200 bg-white',
    iconClass: 'text-error',
    barClass:  'bg-error',
  },
  warning: {
    icon:    AlertTriangle,
    classes: 'border-amber-200 bg-white',
    iconClass: 'text-warning',
    barClass:  'bg-warning',
  },
  info: {
    icon:    Info,
    classes: 'border-blue-200 bg-white',
    iconClass: 'text-info',
    barClass:  'bg-info',
  },
};

export function Toast({ id, type = 'info', title, description, onDismiss, className }) {
  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={cn(
        'relative flex gap-3 w-80 rounded-lg border shadow-lg overflow-hidden',
        'py-3.5 px-4',
        config.classes,
        className
      )}
    >
      {/* Left color bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', config.barClass)} />

      <div className="pl-1 flex gap-3 w-full">
        <Icon size={16} className={cn('shrink-0 mt-0.5', config.iconClass)} />

        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-stone-900 leading-snug">{title}</p>
          )}
          {description && (
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>

        <button
          onClick={() => onDismiss?.(id)}
          className="shrink-0 text-stone-300 hover:text-stone-600 transition-colors duration-100 -mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Toast Container ─────────────────────────────────────────────────────────
export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Alert (Inline) ───────────────────────────────────────────────────────────
export function Alert({ type = 'info', title, children, className, dismissible, onDismiss }) {
  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative flex gap-3 rounded-lg border p-4',
        config.classes,
        className
      )}
    >
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-lg', config.barClass)} />
      <div className="pl-1 flex gap-3 w-full">
        <Icon size={16} className={cn('shrink-0 mt-0.5', config.iconClass)} />
        <div className="flex-1">
          {title && <p className="text-sm font-semibold text-stone-900">{title}</p>}
          {children && <p className="text-sm text-stone-600 mt-0.5">{children}</p>}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="shrink-0 text-stone-300 hover:text-stone-500 transition-colors duration-100"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
