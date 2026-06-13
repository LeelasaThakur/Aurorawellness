'use client';

import { useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  MessageCircle,
  Activity,
  BookOpen,
  LayoutDashboard,
  Sparkles,
  Settings,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  { label: 'Check-in', href: '/checkin', icon: Activity },
  { label: 'Journal', href: '/journal', icon: BookOpen },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Exercises', href: '/exercises', icon: Sparkles },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function NavLink({
  item,
  isActive,
  variant,
}: {
  item: NavItem;
  isActive: boolean;
  variant: 'sidebar' | 'bottom';
}) {
  const Icon = item.icon;

  if (variant === 'bottom') {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
          isActive ? 'text-amber-400' : 'text-white/50 hover:text-white/80'
        }`}
      >
        {isActive && (
          <motion.span
            layoutId="bottom-nav-active"
            className="absolute inset-0 rounded-xl bg-amber-400/10"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <Icon size={20} className="relative z-10" />
        <span className="relative z-10 text-[10px] font-medium leading-none">
          {item.label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        isActive ? 'text-amber-400' : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-amber-400/10 border border-amber-400/20"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <Icon size={20} className="relative z-10" />
      <span className="relative z-10 text-sm font-medium">{item.label}</span>
    </Link>
  );
}

export default function Navigation({ className = '' }: { className?: string }) {
  const pathname = usePathname();

  const isActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/';
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const visibleMobile = useMemo(
    () => NAV_ITEMS.slice(0, 5), // show first 5 on mobile
    []
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav
        aria-label="Main navigation"
        className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 z-30 bg-white/5 backdrop-blur-xl border-r border-white/10 py-6 px-3 gap-1 ${className}`}
      >
        {/* Branding */}
        <div className="flex items-center gap-2 px-4 mb-6">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </span>
          <span className="text-white font-bold text-lg tracking-tight">Aurora</span>
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            variant="sidebar"
          />
        ))}

        {/* Bottom spacer */}
        <div className="mt-auto px-4 py-3 text-xs text-white/30">
          Aurora Wellness v1.0
        </div>
      </nav>

      {/* ── Mobile bottom bar ── */}
      <nav
        aria-label="Main navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 safe-area-pb"
      >
        <div className="flex items-center justify-around px-1 py-1">
          {visibleMobile.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              variant="bottom"
            />
          ))}
        </div>
      </nav>
    </>
  );
}
