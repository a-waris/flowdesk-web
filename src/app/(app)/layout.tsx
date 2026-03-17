'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { getCurrentUser, type User } from '@/lib/api';
import { Separator } from '@/components/ui/separator';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/team':      'Team',
  '/projects':  'Projects',
  '/reports':   'Reports',
  '/settings':  'Settings',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(u => { setUser(u); setReady(true); })
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="relative">
            <div className="h-8 w-8 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-primary" />
          </div>
          <span className="text-xs animate-pulse">Loading…</span>
        </div>
      </div>
    );
  }

  const pageTitle = PAGE_TITLES[pathname] ?? 'Flowdesk';

  return (
    <SidebarProvider>
      <AppSidebar
        user={user ? {
          name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
          email: user.email,
          avatar: user.avatar_url,
        } : null}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <span className="text-xs font-medium text-muted-foreground">{pageTitle}</span>
        </header>
        <main key={pathname} className="flex-1 overflow-auto p-6 animate-fade-up">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
