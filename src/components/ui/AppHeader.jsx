'use client';

import Link from 'next/link';

export default function AppHeader({
  brandHref = '/',
  brandLabel = 'PageBlanche',
  subtitle = '',
  sticky = false,
  translucent = false,
  showDashboardLink = false,
  dashboardHref = '/dashboard',
  dashboardLabel = 'Dashboard',
  children,
}) {
  const headerClassName = [
    'w-full border-b border-pb-border py-4 px-8',
    'flex justify-between items-center',
    sticky ? 'sticky top-0 z-50' : '',
    translucent ? 'bg-pb-background/80 backdrop-blur' : 'bg-pb-background',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClassName}>
      <div className="flex items-center gap-3">
        <Link href={brandHref} className="font-bold text-xl tracking-tight text-pb-accent">
          {brandLabel}
        </Link>
        {subtitle ? (
          <span className="hidden md:inline text-[11px] uppercase tracking-[0.18em] text-pb-foreground/55">
            {subtitle}
          </span>
        ) : null}
        {showDashboardLink ? (
          <Link
            href={dashboardHref}
            className="text-xs font-bold tracking-wider border border-pb-border px-3 py-1.5 rounded-md hover:bg-pb-border/30 transition"
          >
            {dashboardLabel}
          </Link>
        ) : null}
      </div>

      <div className="flex items-center gap-4">{children}</div>
    </header>
  );
}
