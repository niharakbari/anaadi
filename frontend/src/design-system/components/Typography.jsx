import { cn } from '../../lib/utils';

// ─── Typography Components ────────────────────────────────────────────────────

export function Display({ children, className, ...props }) {
  return (
    <h1
      className={cn(
        'text-[2.25rem] font-bold leading-[1.1] tracking-[-0.02em] text-stone-900',
        'font-feature',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function H1({ children, className, ...props }) {
  return (
    <h1
      className={cn(
        'text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.02em] text-stone-900',
        'font-feature',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className, ...props }) {
  return (
    <h2
      className={cn(
        'text-[1.375rem] font-semibold leading-[1.3] tracking-[-0.015em] text-stone-900',
        'font-feature',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className, ...props }) {
  return (
    <h3
      className={cn(
        'text-[1.125rem] font-semibold leading-[1.4] tracking-[-0.01em] text-stone-900',
        'font-feature',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className, ...props }) {
  return (
    <h4
      className={cn(
        'text-[0.9375rem] font-semibold leading-[1.4] tracking-[-0.005em] text-stone-900',
        'font-feature',
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

export function BodyLg({ children, className, as: Tag = 'p', ...props }) {
  return (
    <Tag
      className={cn('text-base font-normal leading-[1.6] text-stone-700', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Body({ children, className, as: Tag = 'p', ...props }) {
  return (
    <Tag
      className={cn('text-sm font-normal leading-[1.5] text-stone-700', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function BodySm({ children, className, as: Tag = 'p', ...props }) {
  return (
    <Tag
      className={cn('text-[0.8125rem] font-normal leading-[1.5] text-stone-600', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Caption({ children, className, ...props }) {
  return (
    <span
      className={cn('text-xs font-normal leading-[1.4] text-stone-400', className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function Label({ children, className, htmlFor, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-xs font-medium leading-[1.3] tracking-[0.02em] text-stone-600 uppercase',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function Code({ children, className, block = false, ...props }) {
  if (block) {
    return (
      <pre
        className={cn(
          'font-mono text-[0.8125rem] leading-relaxed bg-stone-100 border border-stone-200',
          'rounded-md px-4 py-3 overflow-x-auto text-stone-800',
          className
        )}
        {...props}
      >
        <code>{children}</code>
      </pre>
    );
  }
  return (
    <code
      className={cn(
        'font-mono text-[0.8125rem] bg-stone-100 text-stone-800',
        'px-1.5 py-0.5 rounded-xs',
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}
