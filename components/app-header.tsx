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
import { Menu, User } from 'lucide-react';
import Link from 'next/link';
import { JobmoraLogo } from '@/components/jobmora-logo';

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { plan, setPlan, isProUser } = usePlan();

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b bg-background px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Åben menu</span>
      </Button>

      {/* Mobile logo */}
      <div className="flex lg:hidden">
        <Link href="/app" className="flex items-center gap-2">
          <JobmoraLogo size={24} />
          <span className="text-base font-medium">Jobmora</span>
        </Link>
      </div>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-3">
          {/* Plan toggle */}
          <div className="flex items-center gap-2">
            <Badge variant={isProUser ? 'default' : 'secondary'}>
              {isProUser ? 'Pro' : 'Light'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlan(isProUser ? 'light' : 'pro')}
              className="text-xs"
            >
              {isProUser ? 'Light' : 'Opgrader'}
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
                    demo@jobmora.dk
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
