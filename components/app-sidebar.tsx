'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Compass,
  Settings,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JobmoraLogo } from '@/components/jobmora-logo';

const navigation = [
  { name: 'Overblik', href: '/app', icon: LayoutDashboard },
  { name: 'Min profil', href: '/app/profil', icon: User },
  { name: 'Muligheder', href: '/app/muligheder', icon: Compass },
  { name: 'Gemte jobs', href: '/app/gemte-jobs', icon: Bookmark },
];

const bottomNavigation = [
  { name: 'Indstillinger', href: '/app/indstillinger', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-56 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-4 pb-4">
        <div className="flex h-14 shrink-0 items-center">
          <Link href="/app" className="flex items-center gap-2">
            <JobmoraLogo size={24} />
            <span className="text-base font-medium text-foreground">Jobmora</span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-6">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          'group flex gap-x-3 rounded px-2 py-1.5 text-sm font-normal transition-colors'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                {bottomNavigation.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          'group flex gap-x-3 rounded px-2 py-1.5 text-sm font-normal transition-colors'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
