import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MoreHorizontal, TrendingUp, TrendingDown, ExternalLink, Trash2 } from 'lucide-react';

// ─── Base Card ────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false, padding = 'md', onClick, ...props }) {
  const paddingClasses = {
    none: '',
    sm:  'p-3',
    md:  'p-5',
    lg:  'p-6',
    xl:  'p-8',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-stone-200 rounded-lg',
        'shadow-xs',
        paddingClasses[padding],
        hover && [
          'cursor-pointer',
          'transition-all duration-200 ease-out',
          'hover:shadow-md hover:border-stone-300 hover:-translate-y-0.5',
        ],
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, action }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex-1 min-w-0">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-[0.9375rem] font-semibold text-stone-900 tracking-[-0.005em]', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn('text-sm text-stone-500 mt-0.5', className)}>
      {children}
    </p>
  );
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('flex items-center justify-between gap-2 mt-4 pt-4 border-t border-stone-100', className)}>
      {children}
    </div>
  );
}

// ─── Image Card — Jewellery result card ──────────────────────────────────────
export function ImageCard({
  image,
  title,
  sku,
  category,
  similarity,
  status,
  onClick,
  onViewDetails,
  onDelete,
  onSave,
  className,
}) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={cn(
        'group relative bg-white border border-stone-200 rounded-lg overflow-hidden',
        'shadow-xs hover:shadow-md transition-shadow duration-200',
        'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Image container */}
      <div className="relative aspect-square bg-stone-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-stone-300">
              <rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 26L12 18L18 24L26 14L36 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* Similarity badge overlay */}
        {similarity !== undefined && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center h-6 px-2 rounded-full text-[11px] font-semibold bg-stone-900/75 text-white backdrop-blur-sm">
              {Math.round(similarity * 100)}% match
            </span>
          </div>
        )}

        {/* Top-right actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {onSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center shadow-sm hover:bg-stone-50 hover:text-accent transition-colors duration-100"
              title="Save Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600 hover:text-accent"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
              className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center shadow-sm hover:bg-white transition-colors duration-100"
              title="View Details"
            >
              <ExternalLink size={12} className="text-stone-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-100 text-stone-600"
              title="Delete Design"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">{title}</p>
            <p className="text-xs text-stone-400 mt-0.5 font-mono">{sku}</p>
          </div>
          {status && (
            <span
              className={cn(
                'shrink-0 inline-flex h-5 px-1.5 items-center rounded-full text-[10px] font-medium',
                status === 'active'   && 'bg-success-subtle text-success',
                status === 'pending'  && 'bg-warning-subtle text-warning',
                status === 'archived' && 'bg-stone-100 text-stone-500',
              )}
            >
              {status}
            </span>
          )}
        </div>
        {category && (
          <p className="text-xs text-stone-400 mt-1.5">{category}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Stat Card — KPI metric card ─────────────────────────────────────────────
export function StatCard({ label, value, unit, change, changeLabel, icon: Icon, trend, className }) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-stone-50 -translate-y-8 translate-x-8 pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-stone-400 tracking-wide uppercase">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-[1.75rem] font-bold text-stone-900 tabular-nums leading-none tracking-tight">
              {value}
            </span>
            {unit && <span className="text-sm text-stone-400 font-medium">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <TrendingUp size={12} className="text-success" />}
              {isNegative && <TrendingDown size={12} className="text-error" />}
              <span
                className={cn(
                  'text-xs font-medium tabular-nums',
                  isPositive && 'text-success',
                  isNegative && 'text-error',
                  !isPositive && !isNegative && 'text-stone-400',
                )}
              >
                {change}
              </span>
              {changeLabel && (
                <span className="text-xs text-stone-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className="shrink-0 w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
            <Icon size={18} className="text-accent" />
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Action Card — navigational ───────────────────────────────────────────────
export function ActionCard({ title, description, icon: Icon, onClick, className, accentColor }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'w-full text-left p-5 bg-white border border-stone-200 rounded-lg',
        'shadow-xs hover:shadow-md hover:border-stone-300',
        'transition-shadow duration-200',
        'group',
        className
      )}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-stone-100 group-hover:bg-accent-subtle flex items-center justify-center mb-4 transition-colors duration-200">
          <Icon size={18} className="text-stone-500 group-hover:text-accent transition-colors duration-200" />
        </div>
      )}
      <p className="text-sm font-semibold text-stone-900 group-hover:text-accent transition-colors duration-200">
        {title}
      </p>
      <p className="text-xs text-stone-500 mt-1">{description}</p>
    </motion.button>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
export function Divider({ label, className }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs font-medium text-stone-400 tracking-wide uppercase">{label}</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>
    );
  }
  return <div className={cn('h-px bg-stone-200', className)} />;
}
