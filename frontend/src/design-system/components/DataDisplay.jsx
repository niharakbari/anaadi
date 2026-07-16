import { cn } from '../../lib/utils';
import { cva } from 'class-variance-authority';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
  {
    variants: {
      variant: {
        // Status
        active:   'bg-success-subtle  text-success  border border-green-200',
        pending:  'bg-warning-subtle  text-warning  border border-amber-200',
        archived: 'bg-stone-100       text-stone-500 border border-stone-200',
        error:    'bg-error-subtle    text-error    border border-red-200',
        info:     'bg-info-subtle     text-info     border border-blue-200',
        // Neutral variants
        default:  'bg-stone-100 text-stone-600 border border-stone-200',
        accent:   'bg-accent-subtle text-accent border border-amber-200',
        // Solid
        'solid-active':   'bg-success  text-white',
        'solid-error':    'bg-error    text-white',
        'solid-accent':   'bg-accent   text-white',
        'solid-neutral':  'bg-stone-800 text-white',
      },
      size: {
        xs: 'text-[10px] px-1.5 py-0.5',
        sm: 'text-[11px] px-2   py-0.5',
        md: 'text-xs     px-2.5 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'sm',
    },
  }
);

export function Badge({ children, variant, size, dot, className, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'inline-block w-1.5 h-1.5 rounded-full',
            variant === 'active'  && 'bg-success',
            variant === 'pending' && 'bg-warning',
            variant === 'error'   && 'bg-error',
            variant === 'info'    && 'bg-info',
            (!variant || variant === 'default') && 'bg-stone-400',
          )}
        />
      )}
      {children}
    </span>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children, onRemove, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 h-6 pl-2.5 rounded-full text-xs font-medium',
        'bg-stone-100 text-stone-600 border border-stone-200',
        onRemove ? 'pr-1' : 'pr-2.5',
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors duration-100"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 'md', status, className }) {
  const sizes = {
    xs:  { container: 'w-6  h-6',  text: 'text-[10px]', ring: 'w-1.5 h-1.5' },
    sm:  { container: 'w-8  h-8',  text: 'text-xs',      ring: 'w-2   h-2' },
    md:  { container: 'w-9  h-9',  text: 'text-sm',      ring: 'w-2.5 h-2.5' },
    lg:  { container: 'w-11 h-11', text: 'text-base',    ring: 'w-3   h-3' },
    xl:  { container: 'w-14 h-14', text: 'text-lg',      ring: 'w-3.5 h-3.5' },
  };
  const s = sizes[size] || sizes.md;

  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          s.container,
          'rounded-full overflow-hidden bg-accent-subtle border-2 border-white shadow-xs',
          'flex items-center justify-center',
          className
        )}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className={cn(s.text, 'font-semibold text-accent select-none')}>
            {initials}
          </span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            s.ring,
            status === 'online'  && 'bg-success',
            status === 'offline' && 'bg-stone-300',
            status === 'busy'    && 'bg-error',
          )}
        />
      )}
    </div>
  );
}

// ─── Avatar Group ─────────────────────────────────────────────────────────────
export function AvatarGroup({ users = [], max = 4, size = 'sm', className }) {
  const visible = users.slice(0, max);
  const extra = users.length - max;

  return (
    <div className={cn('flex -space-x-1.5', className)}>
      {visible.map((user, i) => (
        <Avatar key={i} name={user.name} src={user.src} size={size} />
      ))}
      {extra > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full border-2 border-white bg-stone-200 text-stone-600 text-xs font-semibold',
            size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-xs'
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
