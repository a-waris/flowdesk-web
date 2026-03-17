'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { getCurrentUser, type User } from '@/lib/api';
import { Separator } from '@/components/ui/separator';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => router.replace('/login'));
  }, [router]);

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
          <span className="text-xs text-muted-foreground">Flowdesk</span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
