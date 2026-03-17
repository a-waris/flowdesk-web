'use client';

import { useEffect, useState } from 'react';
import {
  User as UserIcon, Building2, Palette, Bell, Shield,
  Check, Loader2, Moon, Sun, Monitor, LogOut,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  getCurrentUser, getWorkspace, updateCurrentUser, updateWorkspace,
  getWorkspaceId, invalidateUserCache, type User, type Workspace,
} from '@/lib/api';

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={saving} className="gap-2 h-8 px-3 text-xs">
      {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
      {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
    </Button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [wsId, setWsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName]         = useState('');
  const [lastName, setLastName]           = useState('');
  const [username, setUsername]           = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);

  const [wsName, setWsName]     = useState('');
  const [wsSaving, setWsSaving] = useState(false);
  const [wsSaved, setWsSaved]   = useState(false);

  const [notifDigest,   setNotifDigest]   = useState(true);
  const [notifInvite,   setNotifInvite]   = useState(true);
  const [notifActivity, setNotifActivity] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [u, id] = await Promise.all([getCurrentUser(), getWorkspaceId()]);
        setUser(u);
        setWsId(id);
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setUsername(u.username || '');
        // Workspace fetch is best-effort — don't block if it fails
        getWorkspace()
          .then(ws => { setWorkspace(ws); setWsName(ws.name || ''); })
          .catch(() => {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveProfile() {
    setProfileSaving(true);
    try {
      const updated = await updateCurrentUser({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        username:   username.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      invalidateUserCache();
      setUser(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (e) { console.error(e); }
    finally { setProfileSaving(false); }
  }

  async function saveWorkspace() {
    if (!wsId) return;
    setWsSaving(true);
    try {
      await updateWorkspace(wsId, { name: wsName.trim() });
      setWsSaved(true);
      setTimeout(() => setWsSaved(false), 2500);
    } catch (e) { console.error(e); }
    finally { setWsSaving(false); }
  }

  const initials = user
    ? (`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`).toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'
    : 'U';

  const THEME_OPTIONS = [
    { value: 'dark',   icon: Moon,    label: 'Dark' },
    { value: 'light',  icon: Sun,     label: 'Light' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-up">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, workspace, and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <UserIcon size={14} /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="rounded-xl bg-primary/20 text-primary font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1.5 text-[10px] capitalize">{user?.role ?? 'member'}</Badge>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="janedoe" />
          </div>
          <div className="space-y-1.5">
            <Label>Email address</Label>
            <Input value={user?.email ?? ''} disabled className="opacity-60" />
            <p className="text-[11px] text-muted-foreground">Contact support to change your email.</p>
          </div>
          <div className="flex justify-end">
            <SaveButton saving={profileSaving} saved={profileSaved} onClick={saveProfile} />
          </div>
        </CardContent>
      </Card>

      {/* Workspace */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Building2 size={14} /> Workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws_name">Workspace name</Label>
            <Input id="ws_name" value={wsName} onChange={e => setWsName(e.target.value)} placeholder="My Workspace" />
          </div>
          <div className="space-y-1.5">
            <Label>Workspace ID</Label>
            <Input value={wsId ?? ''} disabled className="opacity-50 font-mono text-xs" />
          </div>
          <div className="flex justify-end">
            <SaveButton saving={wsSaving} saved={wsSaved} onClick={saveWorkspace} />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Palette size={14} /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Theme</Label>
          <div className="flex gap-2 mt-2">
            {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={[
                  'flex flex-1 flex-col items-center gap-2 rounded-lg border px-3 py-3 text-xs font-medium transition-all duration-200 outline-none cursor-pointer',
                  theme === value
                    ? 'border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(124,58,237,0.2)]'
                    : 'border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40',
                ].join(' ')}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Bell size={14} /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            { label: 'Daily digest',   desc: 'Receive a daily summary of your tracked time',  value: notifDigest,   set: setNotifDigest },
            { label: 'Team invites',   desc: 'Notify when someone joins your workspace',       value: notifInvite,   set: setNotifInvite },
            { label: 'Activity alerts',desc: 'Alert when a session exceeds 2 hours',           value: notifActivity, set: setNotifActivity },
          ] as const).map(({ label, desc, value, set }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={value} onCheckedChange={set} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Shield size={14} /> Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">You will be returned to the login screen</p>
            </div>
            <Button
              variant="outline"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => { localStorage.removeItem('flowdesk_token'); window.location.href = '/login'; }}
            >
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
