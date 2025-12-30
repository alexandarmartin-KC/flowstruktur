'use client';

import { ReactNode, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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

const navigation = [
  { name: 'Overblik', href: '/app', icon: LayoutDashboard },
  { name: 'Min profil', href: '/app/profil', icon: User },
  { name: 'Muligheder', href: '/app/muligheder', icon: Compass },
  { name: 'Gemte jobs', href: '/app/gemte-jobs', icon: Bookmark },
];

const bottomNavigation = [
  { name: 'Indstillinger', href: '/app/indstillinger', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="lg:pl-64">
        <AppHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile navigation */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <Link href="/app" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Sparkles className="h-7 w-7 text-primary" />
                <span className="text-xl font-semibold">FlowStruktur</span>
              </Link>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;

                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              isActive
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
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
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              isActive
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
