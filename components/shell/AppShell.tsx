'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bookmark,
  GraduationCap,
  Home,
  MessageCircle,
  Plus,
  Settings,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { bumpNewChat } from '@/lib/sylla/stores/new-chat';
import { ThemeController } from '@/components/shell/ThemeController';
import { UnitContextPicker } from '@/components/shell/UnitContextPicker';
import { useSupabaseSession } from '@/lib/supabase/use-session';
import { getSignInUrl, SYLLA_DISCLAIMER } from '@/lib/sylla/config';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/tools', label: 'Study tools', icon: GraduationCap },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white"
      >
        S
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Sylla</span>
        <span className="block text-[11px] text-black/45 dark:text-white/45">
          by Syllabus Sync
        </span>
      </span>
    </Link>
  );
}

function AccountSection() {
  const session = useSupabaseSession();
  if (!session.ready) {
    return <div className="h-9 animate-pulse rounded-xl bg-black/[0.05] dark:bg-white/[0.06]" />;
  }
  if (session.isSignedIn) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
        <UserCircle2 size={18} className="shrink-0 text-indigo-500" aria-hidden />
        <span className="truncate text-xs" title={session.email ?? undefined}>
          {session.email}
        </span>
      </div>
    );
  }
  return (
    <a
      href={getSignInUrl()}
      className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs font-medium transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-white/15 dark:hover:text-indigo-400"
    >
      <UserCircle2 size={18} aria-hidden />
      Sign in with Syllabus Sync
    </a>
  );
}

/**
 * Standalone-app shell: fixed sidebar on desktop, top header + bottom tab
 * bar on mobile. The future embedded assistant inside Syllabus Sync does NOT
 * use this shell — it mounts ChatView inside the host app's own chrome.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <ThemeController />

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.02] lg:flex">
        <BrandMark />
        <Link
          href="/chat"
          onClick={() => bumpNewChat()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <Plus size={16} aria-hidden /> New chat
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-indigo-500/10 font-medium text-indigo-600 dark:text-indigo-400'
                    : 'text-black/65 hover:bg-black/[0.04] dark:text-white/65 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <UnitContextPicker />
          <AccountSection />
          <p className="px-1 text-[10px] leading-snug text-black/35 dark:text-white/35">
            {SYLLA_DISCLAIMER}
          </p>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-black/5 bg-[var(--background)]/90 px-4 py-2.5 backdrop-blur dark:border-white/10 lg:hidden">
          <BrandMark />
          <div className="w-44">
            <UnitContextPicker compact />
          </div>
        </header>

        <main id="main" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tabs */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-black/5 bg-[var(--background)]/95 backdrop-blur dark:border-white/10 lg:hidden"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${
                  active
                    ? 'font-medium text-indigo-600 dark:text-indigo-400'
                    : 'text-black/50 dark:text-white/50'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
