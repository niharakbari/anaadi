import { useState, useRef } from 'react';
import { Search, X, SlidersHorizontal, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search jewellery designs, SKUs, collections…',
  loading = false,
  showShortcut = true,
  size = 'md',
  className,
  ...props
}) {
  const inputRef = useRef(null);
  const hasValue = value && value.length > 0;

  const sizeClasses = {
    sm: 'h-8  text-xs pl-8 pr-8',
    md: 'h-10 text-sm pl-10 pr-10',
    lg: 'h-12 text-sm pl-12 pr-12',
  };
  const iconSizes = {
    sm: 'left-2.5',
    md: 'left-3',
    lg: 'left-3.5',
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      {/* Left Icon */}
      <span className={cn('absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-stone-400 pointer-events-none z-10', iconSizes[size])}>
        {loading ? (
          <svg className="animate-spin-slow" viewBox="0 0 24 24" fill="none" width="16" height="16">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <Search size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        )}
      </span>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'w-full bg-white border border-stone-200 text-stone-900',
          'placeholder:text-stone-400',
          'rounded-lg transition-all duration-150',
          'outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
          'focus:shadow-sm',
          '[&::-webkit-search-cancel-button]:hidden',
          sizeClasses[size],
          className
        )}
        {...props}
      />

      {/* Right controls */}
      <div className="absolute right-3 flex items-center gap-1.5">
        <AnimatePresence mode="wait">
          {hasValue ? (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              onClick={() => {
                onClear?.();
                inputRef.current?.focus();
              }}
              className="text-stone-400 hover:text-stone-600 transition-colors duration-100 p-0.5 rounded-xs"
            >
              <X size={14} />
            </motion.button>
          ) : showShortcut ? (
            <motion.span
              key="shortcut"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden sm:flex items-center gap-0.5 text-stone-300"
            >
              <kbd className="text-[10px] font-medium border border-stone-200 rounded-xs px-1 py-0.5 bg-stone-50 text-stone-400">
                ⌘K
              </kbd>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Search Filter Chips ──────────────────────────────────────────────────────
export function FilterChip({ label, active, onToggle, count, className }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium',
        'border transition-all duration-150',
        'whitespace-nowrap',
        active
          ? 'bg-accent text-white border-accent shadow-xs'
          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:text-stone-800',
        className
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold',
            active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function SearchFilters({ filters, activeFilters, onToggle, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="flex items-center gap-1 text-xs text-stone-400 mr-1">
        <SlidersHorizontal size={12} />
        Filter
      </span>
      {filters.map((f) => (
        <FilterChip
          key={f.key}
          label={f.label}
          count={f.count}
          active={activeFilters?.includes(f.key)}
          onToggle={() => onToggle?.(f.key)}
        />
      ))}
    </div>
  );
}
