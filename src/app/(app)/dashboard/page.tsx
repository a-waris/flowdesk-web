'use client';

import { useEffect, useState } from 'react';
import { Clock, Users, Layers, TrendingUp, Flame, Keyboard, MousePointerClick } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getWorkspaceId, getWorkspaceStats, listSessions, type WorkspaceStats, type Session } from '@/lib/api';

function fmtHours(h: number) {
  if (!h) return '0h';
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function StatCard({ icon: Icon, label, value, sub, accent = 'text-primary' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className={`flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ${accent}`}>
            <Icon size={14} />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const wsId = await getWorkspaceId();
        const [s, sess] = await Promise.all([
          getWorkspaceStats(wsId),
          listSessions(wsId, { size: '10' }),
        ]);
        setStats(s);
        setSessions(sess.items ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const monthChange = stats && stats.last_month_hours > 0
    ? Math.round(((stats.this_month_hours - stats.last_month_hours) / stats.last_month_hours) * 100)
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Workspace overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Clock}
          label="This month"
          value={loading ? '—' : fmtHours(stats?.this_month_hours ?? 0)}
          sub={monthChange != null ? `${monthChange > 0 ? '+' : ''}${monthChange}% vs last month` : undefined}
        />
        <StatCard icon={Users} label="Team members" value={loading ? '—' : String(stats?.total_users ?? 0)} />
        <StatCard icon={Layers} label="Active projects" value={loading ? '—' : String(stats?.active_projects ?? 0)} />
        <StatCard
          icon={TrendingUp}
          label="Total tracked"
          value={loading ? '—' : fmtHours(stats?.total_hours_tracked ?? 0)}
        />
      </div>

      {/* Recent sessions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Flame size={14} className="text-warning" /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 px-5 pb-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">No sessions recorded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map(s => {
                const dur = s.duration_seconds ? Math.round(s.duration_seconds / 60) : 0;
                const h = Math.floor(dur / 60);
                const m = dur % 60;
                const durStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="text-sm font-medium truncate max-w-xs">{s.task_name || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Keyboard size={11} />{s.keystroke_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MousePointerClick size={11} />{s.mouse_click_count ?? 0}
                      </span>
                      <Badge variant="secondary" className="tabular-nums text-xs">{durStr}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
