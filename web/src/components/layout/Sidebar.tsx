'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import {
  LayoutDashboard, Sparkles, BookOpen, CalendarDays,
  Heart, BarChart3, CheckSquare, MessageSquare, Settings,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generate', label: 'Generate', icon: Sparkles },
  { href: '/bank', label: 'Activity Bank', icon: BookOpen },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { divider: true },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare, badge: true },
  { href: '/brainstorm', label: 'AI Brainstorm', icon: MessageSquare },
  { divider: true },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { pendingTasksCount } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);

  // Sync collapsed state to document body to adjust main content margin-left dynamically
  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div 
        className="sidebar-logo" 
        onClick={() => collapsed && setCollapsed(false)}
        style={{ 
          gap: 8, 
          justifyContent: collapsed ? 'center' : 'space-between',
          cursor: collapsed ? 'pointer' : 'default',
          padding: collapsed ? '0' : '0 16px 0 20px',
          transition: 'all 0.3s'
        }}
        title={collapsed ? "Expand Sidebar" : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img 
            src="/logo.png" 
            alt="ActivityMind Logo" 
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} 
          />
          {!collapsed && <span className="sidebar-logo-text" style={{ fontSize: 20 }}>ActivityMind</span>}
        </div>
        {!collapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 6,
              borderRadius: 6,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Collapse Sidebar"
          >
            <ChevronsLeft size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if ('divider' in item && item.divider) {
            return <div key={`div-${i}`} className="sidebar-divider" />;
          }

          const Icon = item.icon!;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href!);

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">
                <Icon size={20} />
              </span>
              <span className="sidebar-link-text">{item.label}</span>
              {item.badge && pendingTasksCount > 0 && (
                <span className="sidebar-badge">
                  {pendingTasksCount > 9 ? '9+' : pendingTasksCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
