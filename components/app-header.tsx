'use client';

import { usePlan } from '@/contexts/plan-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, User, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { JobmoraLogo } from '@/components/jobmora-logo';

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { plan, setPlan, isProUser } = usePlan();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Åben menu</span>
      </Button>

      {/* Mobile logo */}
      <div className="flex lg:hidden">
        <Link href="/app" className="flex items-center gap-2">
          <JobmoraLogo size={24} />
          <span className="font-semibold">Jobmora</span>
        </Link>
      </div>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Plan toggle */}
          <div className="flex items-center gap-2">
            <Badge variant={isProUser ? 'default' : 'secondary'}>
              {isProUser ? 'PRO Plan' : 'Light Plan'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlan(isProUser ? 'light' : 'pro')}
            >
              {isProUser ? 'Skift til Light' : 'Opgrader til Pro'}
            </Button>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Demo Bruger</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    demo@flowstruktur.dk
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/indstillinger">Indstillinger</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/">Tilbage til forsiden</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
