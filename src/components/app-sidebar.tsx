'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Layers, BarChart3, Settings,
  Zap, LogOut, ChevronsUpDown,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/team',      icon: Users,           label: 'Team' },
  { href: '/projects',  icon: Layers,          label: 'Projects' },
  { href: '/reports',   icon: BarChart3,        label: 'Reports' },
  { href: '/settings',  icon: Settings,        label: 'Settings' },
];

interface AppSidebarProps {
  user?: { name?: string; email?: string; avatar?: string } | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'FD';

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary animate-glow">
            <Zap size={16} className="text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Flowdesk
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-1">
              {NAV.map(({ href, icon: Icon, label }, i) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <SidebarMenuItem key={href} style={{ animationDelay: `${i * 40}ms` }} className="animate-fade-up">
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={active}
                      tooltip={label}
                      className={cn(
                        'relative transition-all duration-200 rounded-lg h-9',
                        active
                          ? 'nav-active font-medium'
                          : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-white/[0.04]'
                      )}
                    >
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
                      <span className="text-[13px] tracking-[-0.01em]">{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
                'hover:bg-sidebar-accent transition-all duration-200 outline-none',
                'group-data-[collapsible=icon]:justify-center'
              )}>
                <Avatar className="h-7 w-7 rounded-lg shrink-0">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="rounded-lg bg-primary/20 text-primary text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0 text-left leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-[13px] font-semibold text-sidebar-foreground">{user?.name ?? 'Flowdesk'}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronsUpDown size={14} className="ml-auto shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-48 animate-scale-in">
                <DropdownMenuItem render={<Link href="/settings" />}>
                  <Settings size={13} className="mr-2 text-muted-foreground" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    localStorage.removeItem('flowdesk_token');
                    window.location.href = '/login';
                  }}
                >
                  <LogOut size={13} className="mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
