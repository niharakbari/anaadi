import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { motion } from 'framer-motion';

// ─── Button Variants ─────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles — always applied
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-md text-sm leading-none',
    'transition-all duration-150 ease-out',
    'select-none cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        // Primary — brand accent fill
        primary: [
          'bg-accent text-white border border-accent',
          'hover:bg-accent-hover hover:border-accent-hover',
          'active:scale-[0.98]',
          'shadow-xs hover:shadow-sm',
        ],
        // Secondary — subtle neutral fill
        secondary: [
          'bg-stone-100 text-stone-800 border border-stone-200',
          'hover:bg-stone-200 hover:border-stone-300 hover:text-stone-900',
          'active:scale-[0.98]',
          'shadow-xs',
        ],
        // Outline — border only
        outline: [
          'bg-transparent text-stone-700 border border-stone-300',
          'hover:bg-stone-50 hover:border-stone-400 hover:text-stone-900',
          'active:scale-[0.98]',
        ],
        // Ghost — no background
        ghost: [
          'bg-transparent text-stone-600 border border-transparent',
          'hover:bg-stone-100 hover:text-stone-900',
          'active:scale-[0.98]',
        ],
        // Destructive — error red
        destructive: [
          'bg-error text-white border border-error',
          'hover:bg-red-700 hover:border-red-700',
          'active:scale-[0.98]',
          'shadow-xs',
        ],
        // Link — text only
        link: [
          'bg-transparent text-accent border-transparent underline-offset-4',
          'hover:underline hover:text-accent-hover',
          'p-0 h-auto',
        ],
        // Accent subtle — soft accent for highlights
        'accent-subtle': [
          'bg-accent-subtle text-accent border border-amber-200',
          'hover:bg-amber-200 hover:border-amber-300',
          'active:scale-[0.98]',
        ],
      },
      size: {
        xs:  'h-7  px-2.5 text-xs rounded-sm gap-1',
        sm:  'h-8  px-3   text-sm rounded-sm',
        md:  'h-9  px-4   text-sm rounded-md',
        lg:  'h-11 px-5   text-[0.9375rem] rounded-md',
        xl:  'h-12 px-6   text-base rounded-lg',
        icon:'h-9  w-9    rounded-md p-0',
        'icon-sm':'h-8 w-8 rounded-md p-0',
        'icon-lg':'h-11 w-11 rounded-lg p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size:    'md',
    },
  }
);

export function Button({
  children,
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  iconLeft,
  iconRight,
  ...props
}) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin-slow h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        iconLeft && <span className="shrink-0">{iconLeft}</span>
      )}
      {children}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </Comp>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────────────────
export function IconButton({ children, className, variant = 'ghost', size = 'icon', tooltip, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Button Group (Segmented Control) ─────────────────────────────────────────
export function ButtonGroup({ children, className }) {
  return (
    <div
      className={cn(
        'inline-flex items-center',
        'border border-stone-200 rounded-md overflow-hidden',
        'divide-x divide-stone-200',
        '[&>button]:rounded-none [&>button]:border-0 [&>button]:shadow-none',
        className
      )}
    >
      {children}
    </div>
  );
}

export { buttonVariants };
