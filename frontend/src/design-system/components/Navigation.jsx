import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Search, Upload, Database, Settings,
  Gem, Clock, Activity, LogOut
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { Avatar } from './DataDisplay';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      id: 'dashboard' },
  { icon: Search,          label: 'AI Search',      id: 'search'    },
  { icon: Upload,          label: 'Upload',         id: 'upload'    },
  { icon: Database,        label: 'Catalogue',      id: 'catalogue' },
  { icon: Clock,           label: 'Search History', id: 'history'   },
  { icon: Activity,        label: 'AI Status',      id: 'status'    },
];

const bottomItems = [
  { icon: Settings,        label: 'Settings',       id: 'settings' },
];

export function Sidebar({ onItemClick, className }) {
  return (
    <aside
      className={cn(
        'relative flex flex-col h-full w-60 bg-white border-r border-stone-200 shrink-0',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-stone-100 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Gem size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-bold text-stone-900 tracking-[-0.01em] truncate">
            Anaadi
          </p>
          <p className="text-[10px] text-stone-400 truncate">Jewellery AI</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
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
            onClick={() => onItemClick?.(item.id)}
          />
        ))}

        {/* User profile compact section with inline logout */}
        <div className="flex items-center justify-between gap-2 px-2 py-1 mt-1 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name="Rahul Verma" size="xs" className="shrink-0" />
            <span className="text-xs font-medium text-stone-600 truncate">Rahul Verma</span>
          </div>
          <button
            onClick={() => console.log('Mock logout')}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none shrink-0"
            title="Log Out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ item, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={`/${item.id}`}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'relative w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left',
          'transition-all duration-150 overflow-hidden',
          isActive
            ? 'bg-accent-subtle text-accent'
            : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className="shrink-0" />
          <span className="text-sm font-medium truncate">{item.label}</span>
          {isActive && (
            <motion.div
              layoutId="sidebar-indicator"
              className="absolute left-0 w-0.5 h-5 bg-accent rounded-full"
            />
          )}
        </>
      )}
    </NavLink>
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
