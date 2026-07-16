import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, Upload, Database, Settings,
  Users, ChevronLeft, ChevronRight, Bell, HelpCircle,
  Gem, ChevronDown, LogOut, Moon, Sun, Command
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from './DataDisplay';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    id: 'dashboard' },
  { icon: Search,           label: 'Image Search', id: 'search'    },
  { icon: Upload,           label: 'Upload',       id: 'upload'    },
  { icon: Database,         label: 'Catalogue',    id: 'catalogue' },
  { icon: Users,            label: 'Team',         id: 'team'      },
];

const bottomItems = [
  { icon: Settings,   label: 'Settings',   id: 'settings' },
  { icon: HelpCircle, label: 'Help',       id: 'help'     },
];

export function Sidebar({ activeItem = 'search', onItemClick, className }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative flex flex-col h-full bg-white border-r border-stone-200 overflow-hidden shrink-0',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-stone-100 shrink-0 overflow-hidden">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Gem size={14} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="min-w-0"
            >
              <p className="text-[0.8125rem] font-bold text-stone-900 tracking-[-0.01em] truncate">
                Anaadi
              </p>
              <p className="text-[10px] text-stone-400 truncate">Jewellery AI</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={activeItem === item.id}
            collapsed={collapsed}
            onClick={() => onItemClick?.(item.id)}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-2 space-y-0.5 border-t border-stone-100 shrink-0">
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={activeItem === item.id}
            collapsed={collapsed}
            onClick={() => onItemClick?.(item.id)}
          />
        ))}

        {/* User section */}
        <div className="flex items-center gap-2.5 px-2 py-2 mt-1 rounded-lg hover:bg-stone-50 cursor-pointer overflow-hidden">
          <Avatar name="Rahul Verma" size="sm" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-stone-800 truncate">Rahul Verma</p>
                <p className="text-[10px] text-stone-400 truncate">Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute top-14 -right-3 z-20',
          'w-6 h-6 rounded-full bg-white border border-stone-200 shadow-sm',
          'flex items-center justify-center',
          'text-stone-400 hover:text-stone-700 hover:border-stone-300',
          'transition-colors duration-150'
        )}
      >
        {collapsed
          ? <ChevronRight size={10} />
          : <ChevronLeft size={10}  />
        }
      </button>
    </motion.aside>
  );
}

function SidebarItem({ item, active, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left',
        'transition-all duration-150 overflow-hidden',
        active
          ? 'bg-accent-subtle text-accent'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
      )}
    >
      <Icon size={16} className="shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.12 }}
            className="text-sm font-medium truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 w-0.5 h-5 bg-accent rounded-full"
        />
      )}
    </button>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
export function TopBar({ title, breadcrumb, actions, className }) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-4',
        'h-14 px-6 border-b border-stone-200 bg-white',
        'shrink-0',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {breadcrumb ? (
          <Breadcrumb items={breadcrumb} />
        ) : (
          <h1 className="text-[0.9375rem] font-semibold text-stone-900 tracking-[-0.01em] truncate">
            {title}
          </h1>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
export function Breadcrumb({ items = [], className }) {
  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)} aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-stone-300">
              <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="text-stone-500 hover:text-stone-800 transition-colors duration-100"
            >
              {item.label}
            </a>
          ) : (
            <span className={cn(
              i === items.length - 1
                ? 'font-medium text-stone-900'
                : 'text-stone-500'
            )}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
