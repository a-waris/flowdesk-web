'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Mail, MoreHorizontal, Trash2, Clock, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  getWorkspaceId, listWorkspaceMembers, listPendingInvitations,
  inviteMember, revokeInvitation, removeWorkspaceMember,
  type WorkspaceMember, type WorkspaceInvitation,
} from '@/lib/api';

const ROLE_COLORS: Record<string, string> = {
  owner:  'bg-primary/15 text-primary border-primary/20',
  admin:  'bg-warning/15 text-warning border-warning/20',
  member: 'bg-muted text-muted-foreground border-border',
  viewer: 'bg-muted text-muted-foreground border-border',
  guest:  'bg-muted/50 text-muted-foreground border-border',
};

function initials(name: string) {
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TeamPage() {
  const [wsId, setWsId]               = useState<string | null>(null);
  const [members, setMembers]         = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [inviteOpen, setInviteOpen]   = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting]       = useState(false);
  const [inviteError, setInviteError] = useState('');

  async function load(id: string) {
    const [mem, inv] = await Promise.all([
      listWorkspaceMembers(id),
      listPendingInvitations(id),
    ]);
    setMembers(mem.items ?? []);
    setInvitations(Array.isArray(inv) ? inv : []);
    setLoading(false);
  }

  useEffect(() => {
    getWorkspaceId().then(id => { setWsId(id); load(id); }).catch(() => setLoading(false));
  }, []);

  async function handleInvite() {
    if (!wsId || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');
    try {
      await inviteMember(wsId, inviteEmail.trim().toLowerCase());
      setInviteEmail('');
      setInviteOpen(false);
      load(wsId);
    } catch (e: unknown) {
      setInviteError(e instanceof Error ? e.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(token: string) {
    if (!wsId) return;
    await revokeInvitation(token).catch(() => {});
    load(wsId);
  }

  async function handleRemove(userId: string) {
    if (!wsId) return;
    await removeWorkspaceMember(wsId, userId).catch(() => {});
    load(wsId);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''} · {invitations.length} pending
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus size={15} /> Invite member
        </Button>
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ShieldCheck size={14} /> Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 px-5 pb-5">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="px-5 pb-10 pt-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                <Users size={22} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No members yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 rounded-lg shrink-0">
                      <AvatarImage src={m.user_avatar_url} />
                      <AvatarFallback className="rounded-lg bg-primary/15 text-primary text-xs font-bold">
                        {initials(m.user_full_name || m.user_email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none">{m.user_full_name || m.user_username}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold capitalize ${ROLE_COLORS[m.role] ?? ROLE_COLORS.member}`}
                    >
                      {m.role}
                    </Badge>
                    {m.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal size={14} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="animate-scale-in">
                          <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(m.user_id)}>
                            <Trash2 size={13} className="mr-2" /> Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {(invitations.length > 0 || (!loading && invitations.length > 0)) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={14} /> Pending invitations · {invitations.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Mail size={13} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Sent {new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] text-warning border-warning/20 bg-warning/10 hidden sm:flex">
                      pending
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRevoke(inv.token)}
                      title="Revoke invitation"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={16} /> Invite a team member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              They&apos;ll receive an email with a link to join your workspace.
            </p>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              autoFocus
            />
            {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="gap-2">
              <Mail size={14} />
              {inviting ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
