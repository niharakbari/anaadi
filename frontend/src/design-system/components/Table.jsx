import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ children, className }) {
  return (
    <div className={cn('w-full overflow-hidden rounded-lg border border-stone-200 shadow-xs', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children, className }) {
  return (
    <thead className={cn('bg-stone-50 border-b border-stone-200', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }) {
  return (
    <tbody className={cn('bg-white divide-y divide-stone-100', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, selected, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-100',
        onClick && 'cursor-pointer',
        selected ? 'bg-accent-subtle/50' : 'hover:bg-stone-50/70',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  className,
  sortable,
  sortDir, // 'asc' | 'desc' | undefined
  onSort,
  align = 'left',
}) {
  const alignClasses = {
    left:   'text-left',
    right:  'text-right',
    center: 'text-center',
  };

  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={cn(
        'px-4 py-2.5 text-xs font-medium text-stone-400 tracking-wide uppercase',
        alignClasses[align],
        sortable && 'cursor-pointer select-none hover:text-stone-600 transition-colors duration-100',
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="flex flex-col">
            <ChevronUp
              size={10}
              className={cn(sortDir === 'asc' ? 'text-accent' : 'text-stone-300')}
            />
            <ChevronDown
              size={10}
              className={cn(sortDir === 'desc' ? 'text-accent' : 'text-stone-300', '-mt-0.5')}
            />
          </span>
        )}
      </span>
    </th>
  );
}

export function TableCell({ children, className, align = 'left', muted }) {
  const alignClasses = {
    left:   'text-left',
    right:  'text-right',
    center: 'text-center',
  };

  return (
    <td
      className={cn(
        'px-4 py-3',
        alignClasses[align],
        muted ? 'text-stone-400' : 'text-stone-700',
        className
      )}
    >
      {children}
    </td>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange, className }) {
  const getPages = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const pages = getPages(page, totalPages);

  return (
    <div className={cn('flex items-center justify-between px-4 py-3 border-t border-stone-100', className)}>
      <span className="text-xs text-stone-400">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-7 w-7 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 3L5 7L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>

        {pages.map((p, i) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${i}`} className="text-stone-400 px-1 text-xs font-medium">
                ...
              </span>
            );
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'h-7 min-w-[28px] px-1.5 rounded-md text-xs font-medium transition-colors duration-100',
                page === p
                  ? 'bg-accent text-white'
                  : 'text-stone-500 hover:bg-stone-100'
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-7 w-7 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 3L9 7L5.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  );
}
