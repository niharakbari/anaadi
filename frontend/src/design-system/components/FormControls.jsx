import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

// ─── Text Input ───────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input(
  {
    className,
    type = 'text',
    size = 'md',
    state,           // 'error' | 'success' | undefined
    iconLeft,
    iconRight,
    placeholder,
    disabled,
    ...props
  },
  ref
) {
  const sizeClasses = {
    sm: 'h-8  text-xs px-2.5 rounded-sm',
    md: 'h-9  text-sm px-3   rounded-md',
    lg: 'h-11 text-sm px-4   rounded-md',
  };

  const stateClasses = {
    error:   'border-error focus:ring-error/20 focus:border-error',
    success: 'border-success focus:ring-success/20 focus:border-success',
  };

  if (iconLeft || iconRight) {
    return (
      <div className="relative flex items-center">
        {iconLeft && (
          <span className="absolute left-3 text-stone-400 pointer-events-none flex items-center">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full bg-white border border-stone-200 text-stone-900',
            'placeholder:text-stone-400',
            'transition-all duration-150',
            'outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
            'disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed',
            sizeClasses[size],
            iconLeft  && 'pl-9',
            iconRight && 'pr-9',
            state && stateClasses[state],
            className
          )}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 text-stone-400 flex items-center">
            {iconRight}
          </span>
        )}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'w-full bg-white border border-stone-200 text-stone-900',
        'placeholder:text-stone-400',
        'transition-all duration-150',
        'outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
        'disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed',
        sizeClasses[size],
        state && stateClasses[state],
        className
      )}
      {...props}
    />
  );
});

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(function Textarea(
  { className, state, rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full bg-white border border-stone-200 text-stone-900',
        'placeholder:text-stone-400 text-sm',
        'rounded-md px-3 py-2.5',
        'transition-all duration-150 resize-none',
        'outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
        'disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed',
        state === 'error'   && 'border-error   focus:ring-error/20 focus:border-error',
        state === 'success' && 'border-success focus:ring-success/20 focus:border-success',
        className
      )}
      {...props}
    />
  );
});

// ─── Form Field ───────────────────────────────────────────────────────────────
export function FormField({ label, htmlFor, hint, error, required, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium tracking-wide text-stone-600"
        >
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-error flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-stone-400">{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full h-9 appearance-none bg-white border border-stone-200 text-stone-900 text-sm',
          'rounded-md px-3 pr-9',
          'transition-all duration-150',
          'outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
          'disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed',
          'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
export function Checkbox({ id, label, checked, onChange, disabled, className, ...props }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-2.5 cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            'w-4 h-4 rounded-sm border-2 border-stone-300 bg-white',
            'transition-all duration-150',
            'peer-checked:bg-accent peer-checked:border-accent',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-accent/20',
            'group-hover:border-stone-400',
            'flex items-center justify-center'
          )}
        >
          {checked && (
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
      {label && <span className="text-sm text-stone-700 select-none">{label}</span>}
    </label>
  );
}

// ─── Switch / Toggle ──────────────────────────────────────────────────────────
export function Switch({ id, label, checked, onChange, disabled, size = 'md', className }) {
  const sizes = {
    sm: { track: 'w-8 h-4',   thumb: 'w-3 h-3',   translate: 'translate-x-4' },
    md: { track: 'w-10 h-5.5',thumb: 'w-4 h-4',   translate: 'translate-x-5' },
    lg: { track: 'w-12 h-6',  thumb: 'w-4.5 h-4.5',translate: 'translate-x-6'},
  };
  // const s = sizes[size] || sizes.md;

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-2.5 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full',
          'w-10 h-[22px]',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          checked ? 'bg-accent' : 'bg-stone-200',
          'cursor-pointer'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 inline-block w-4 h-4 rounded-full bg-white shadow-xs',
            'transition-transform duration-200 ease-out',
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span className="text-sm text-stone-700 select-none">{label}</span>}
    </label>
  );
}
