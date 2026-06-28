'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Sparkles, BookOpen, CalendarDays,
  Heart, BarChart3
} from 'lucide-react';

const mobileNavItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/generate', label: 'Generate', icon: Sparkles },
  { href: '/bank', label: 'Bank', icon: BookOpen },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        {mobileNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="mobile-nav-link-icon">
                <Icon size={22} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
