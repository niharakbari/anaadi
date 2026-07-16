import { motion } from 'framer-motion';
import { Search, FolderOpen, WifiOff, ShieldAlert, CheckCircle2, RefreshCw, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Empty State ──────────────────────────────────────────────────────────────
const emptyStateConfig = {
  search: {
    icon: Search,
    title: 'No results found',
    description: "Try adjusting your search or filters to find what you're looking for.",
  },
  empty: {
    icon: FolderOpen,
    title: 'Nothing here yet',
    description: 'Get started by uploading your first jewellery image.',
  },
  offline: {
    icon: WifiOff,
    title: "You're offline",
    description: 'Check your connection and try again.',
  },
};

export function EmptyState({
  type = 'empty',
  title,
  description,
  icon: CustomIcon,
  action,
  actionLabel,
  onAction,
  size = 'md',
  className,
}) {
  const config = emptyStateConfig[type] || emptyStateConfig.empty;
  const Icon = CustomIcon || config.icon;

  const sizes = {
    sm: { icon: 'w-10 h-10', iconSize: 18, title: 'text-sm', desc: 'text-xs', gap: 'gap-2' },
    md: { icon: 'w-14 h-14', iconSize: 24, title: 'text-base', desc: 'text-sm', gap: 'gap-3' },
    lg: { icon: 'w-20 h-20', iconSize: 32, title: 'text-lg', desc: 'text-base', gap: 'gap-4' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}
    >
      <div className={cn(s.icon, 'rounded-xl bg-stone-100 flex items-center justify-center mb-4 text-stone-400')}>
        <Icon size={s.iconSize} />
      </div>
      <p className={cn(s.title, 'font-semibold text-stone-800')}>
        {title || config.title}
      </p>
      <p className={cn(s.desc, 'text-stone-400 mt-1.5 max-w-xs')}>
        {description || config.description}
      </p>
      {(action || onAction) && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-accent text-white text-sm font-medium hover:bg-amber-800 transition-colors duration-150 shadow-xs"
        >
          {action || actionLabel}
        </button>
      )}
    </motion.div>
  );
}

// ─── Loading State ─────────────────────────────────────────────────────────────

// Spinner
export function Spinner({ size = 'md', className }) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };
  return (
    <svg
      className={cn('animate-spin-slow text-accent', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

// Skeleton block
export function SkeletonBlock({ className, rounded }) {
  return (
    <div
      className={cn(
        'skeleton',
        rounded === 'full' ? 'rounded-full' : rounded === 'sm' ? 'rounded-sm' : 'rounded-md',
        className
      )}
    />
  );
}

// Card skeleton
export function SkeletonCard({ className }) {
  return (
    <div className={cn('bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-3', className)}>
      <SkeletonBlock className="h-4 w-2/3" />
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
      <div className="flex items-center gap-2 pt-1">
        <SkeletonBlock className="w-8 h-8" rounded="full" />
        <div className="space-y-1.5 flex-1">
          <SkeletonBlock className="h-3 w-1/3" />
          <SkeletonBlock className="h-2.5 w-1/4" />
        </div>
      </div>
    </div>
  );
}

// Image card skeleton
export function SkeletonImageCard({ className }) {
  return (
    <div className={cn('bg-white border border-stone-200 rounded-lg overflow-hidden shadow-xs', className)}>
      <SkeletonBlock className="aspect-square w-full rounded-none" />
      <div className="p-3.5 space-y-2">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// Table row skeleton
export function SkeletonTableRow() {
  return (
    <tr className="border-b border-stone-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <SkeletonBlock className={cn('h-3.5', i === 1 ? 'w-8 rounded-full' : i === 2 ? 'w-3/4' : 'w-1/2')} />
        </td>
      ))}
    </tr>
  );
}

// Loading overlay
export function LoadingOverlay({ label = 'Processing…', className }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-3',
        'bg-white/80 backdrop-blur-sm rounded-lg z-10',
        className
      )}
    >
      <Spinner size="lg" />
      <p className="text-sm font-medium text-stone-500 animate-pulse-gentle">{label}</p>
    </motion.div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
export function ErrorState({ title, description, onRetry, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}
    >
      <div className="w-14 h-14 rounded-xl bg-error-subtle flex items-center justify-center mb-4">
        <ShieldAlert size={24} className="text-error" />
      </div>
      <p className="text-base font-semibold text-stone-800">
        {title || 'Something went wrong'}
      </p>
      <p className="text-sm text-stone-400 mt-1.5 max-w-xs">
        {description || 'An unexpected error occurred. Please try again or contact support.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors duration-150"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </motion.div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────
export function SuccessState({ title, description, action, onAction, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}
    >
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
        className="w-14 h-14 rounded-xl bg-success-subtle flex items-center justify-center mb-4"
      >
        <CheckCircle2 size={24} className="text-success" />
      </motion.div>
      <p className="text-base font-semibold text-stone-800">
        {title || 'All done!'}
      </p>
      <p className="text-sm text-stone-400 mt-1.5 max-w-xs">
        {description || 'Your changes have been saved successfully.'}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-accent text-white text-sm font-medium hover:bg-amber-800 transition-colors duration-150"
        >
          {action || 'Continue'}
        </button>
      )}
    </motion.div>
  );
}
