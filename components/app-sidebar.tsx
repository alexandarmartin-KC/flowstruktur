'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  User,
  Target,
  TrendingUp,
  Briefcase,
  ClipboardList,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlan } from '@/contexts/plan-context';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Mit CV', href: '/app/cv', icon: FileText },
  { name: 'Personprofil', href: '/app/personprofil', icon: User },
  { name: '360° Overblik', href: '/app/360', icon: Target },
  { name: 'Karrierespor', href: '/app/karrierespor', icon: TrendingUp },
  { name: 'Jobmatch', href: '/app/jobmatch', icon: Briefcase },
  { name: 'Action Plan', href: '/app/plan', icon: ClipboardList, proBadge: true },
  { name: 'Indstillinger', href: '/app/indstillinger', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isProUser } = usePlan();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/app" className="flex items-center gap-2">
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
                  const isLocked = item.proBadge && !isProUser;

                  return (
                    <li key={item.name}>
                      <Link
                        href={isLocked ? '#' : item.href}
                        className={cn(
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium',
                          isLocked && 'opacity-60 cursor-not-allowed'
                        )}
                        onClick={(e) => {
                          if (isLocked) e.preventDefault();
                        }}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.name}
                        {item.proBadge && (
                          <Badge variant={isProUser ? 'secondary' : 'default'} className="ml-auto">
                            PRO
                          </Badge>
                        )}
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
