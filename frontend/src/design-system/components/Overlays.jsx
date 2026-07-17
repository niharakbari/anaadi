import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Dialog ───────────────────────────────────────────────────────────────────
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', className }) {
  const sizes = {
    sm:  'max-w-sm',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-4xl',
    full:'max-w-[90vw]',
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={cn(
              'relative z-10 w-full bg-white rounded-xl shadow-xl',
              'border border-stone-200',
              'flex flex-col max-h-[90vh]',
              sizes[size],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-stone-100 shrink-0">
              <div>
                {title && (
                  <h2 className="text-base font-semibold text-stone-900 tracking-[-0.01em]">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-stone-500 mt-1">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-100"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 flex items-center justify-end gap-2.5 px-6 py-4 border-t border-stone-100 bg-stone-50/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Sheet (Side Drawer) ──────────────────────────────────────────────────────
export function Sheet({ open, onClose, title, children, side = 'right', width = '400px', className }) {
  const slideVariants = {
    right: {
      hidden:  { x: '100%', opacity: 0.8 },
      visible: { x: 0, opacity: 1 },
      exit:    { x: '100%', opacity: 0.8 },
    },
    left: {
      hidden:  { x: '-100%', opacity: 0.8 },
      visible: { x: 0, opacity: 1 },
      exit:    { x: '-100%', opacity: 0.8 },
    },
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.div
            variants={slideVariants[side]}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            style={{ width }}
            className={cn(
              'relative z-10 flex flex-col bg-white shadow-xl border-l border-stone-200',
              side === 'right' ? 'ml-auto' : 'mr-auto',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
              {title && (
                <h3 className="text-[0.9375rem] font-semibold text-stone-900 tracking-[-0.01em]">{title}</h3>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-100"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
export function Tooltip({ children, content, side = 'top', className }) {
  return (
    <div className={cn('relative inline-flex group/tooltip', className)}>
      {children}
      <div
        className={cn(
          'pointer-events-none absolute z-50 opacity-0 group-hover/tooltip:opacity-100',
          'transition-opacity duration-100',
          'px-2.5 py-1.5 rounded-md',
          'bg-stone-900 text-white text-xs font-medium',
          'whitespace-nowrap shadow-lg',
          'after:content-[""] after:absolute after:border-4 after:border-transparent',
          side === 'top'    && 'bottom-full left-1/2 -translate-x-1/2 mb-2 after:top-full after:left-1/2 after:-translate-x-1/2 after:border-t-stone-900',
          side === 'bottom' && 'top-full  left-1/2 -translate-x-1/2 mt-2 after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-b-stone-900',
          side === 'left'   && 'right-full top-1/2 -translate-y-1/2 mr-2 after:left-full after:top-1/2 after:-translate-y-1/2 after:border-l-stone-900',
          side === 'right'  && 'left-full  top-1/2 -translate-y-1/2 ml-2 after:right-full after:top-1/2 after:-translate-y-1/2 after:border-r-stone-900',
        )}
      >
        {content}
      </div>
    </div>
  );
}

// ─── Dropdown Menu ────────────────────────────────────────────────────────────
export function DropdownMenu({ trigger, items, align = 'left', className }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const handleOpen = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };

  const handleClose = () => {
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <div
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className={cn('inline-block', className)}
      >
        <DropdownMenuPrimitive.Trigger asChild>
          {trigger}
        </DropdownMenuPrimitive.Trigger>
      </div>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align === 'right' ? 'end' : 'start'}
          sideOffset={6}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          className="z-50 min-w-[180px] py-1 bg-white border border-stone-200 rounded-lg shadow-lg focus:outline-none"
        >
          {items.map((item, i) =>
            item.separator ? (
              <DropdownMenuPrimitive.Separator key={i} className="h-px bg-stone-100 my-1" />
            ) : (
              <DropdownMenuPrimitive.Item
                key={i}
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left cursor-pointer select-none focus:outline-none',
                  item.destructive
                    ? 'text-error focus:bg-error-subtle focus:text-error'
                    : 'text-stone-700 focus:bg-stone-50 focus:text-stone-900',
                  item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                {item.icon && <span className="text-stone-400">{item.icon}</span>}
                {item.label}
                {item.shortcut && (
                  <kbd className="ml-auto text-[10px] text-stone-300">{item.shortcut}</kbd>
                )}
              </DropdownMenuPrimitive.Item>
            )
          )}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
