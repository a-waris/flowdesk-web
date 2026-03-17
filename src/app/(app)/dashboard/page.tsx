'use client';

import { useEffect, useState } from 'react';
import {
  Clock, Users, Layers, TrendingUp, Flame,
  Keyboard, MousePointerClick, ArrowUp, ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getWorkspaceId, getWorkspaceStats, listSessions, type WorkspaceStats, type Session } from '@/lib/api';

function fmtHours(h: number) {
  if (!h) return '0h';
  const hours = Math.floor(h);
  const mins  = Math.round((h - hours) * 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function fmtDur(secs: number) {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-muted-foreground';
}

// Build Mon–Sun for the current week
function buildWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + toMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: number | null;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, sub, trend, delay = 0 }: StatCardProps) {
  return (
    <Card className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon size={14} />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums animate-count-up">{value}</p>
        {sub && (
          <div className="flex items-center gap-1 mt-1">
            {trend != null && (
              trend > 0
                ? <ArrowUp size={11} className="text-success" />
                : <ArrowDown size={11} className="text-destructive" />
            )}
            <p className={`text-xs ${trend != null ? (trend > 0 ? 'text-success' : 'text-destructive') : 'text-muted-foreground'}`}>{sub}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats]     = useState<WorkspaceStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const wsId = await getWorkspaceId();
        const [s, sess] = await Promise.all([
          getWorkspaceStats(wsId),
          listSessions(wsId, { size: '50' }),
        ]);
        setStats(s);
        setSessions(sess.items ?? []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const monthChange = stats && stats.last_month_hours > 0
    ? Math.round(((stats.this_month_hours - stats.last_month_hours) / stats.last_month_hours) * 100)
    : null;

  // Weekly chart data
  const weekDays = buildWeekDays();
  const todayStr = new Date().toDateString();

  const weekData = weekDays.map(day => {
    const dayStr = day.toDateString();
    const isFuture = day > new Date();
    const secs = sessions
      .filter(s => new Date(s.started_at).toDateString() === dayStr)
      .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    return { day, secs, isFuture, isToday: dayStr === todayStr };
  });

  const maxSecs = Math.max(...weekData.map(d => d.secs), 3600); // at least 1h for scale
  const weekTotal = weekData.filter(d => !d.isFuture).reduce((s, d) => s + d.secs, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Workspace overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 stagger">
        <StatCard
          icon={Clock}
          label="This month"
          value={loading ? '—' : fmtHours(stats?.this_month_hours ?? 0)}
          sub={monthChange != null ? `${monthChange > 0 ? '+' : ''}${monthChange}% vs last month` : undefined}
          trend={monthChange}
          delay={0}
        />
        <StatCard icon={Users}     label="Team members"   value={loading ? '—' : String(stats?.total_users ?? 0)}    delay={60}  />
        <StatCard icon={Layers}    label="Active projects" value={loading ? '—' : String(stats?.active_projects ?? 0)} delay={120} />
        <StatCard icon={TrendingUp} label="Total tracked"  value={loading ? '—' : fmtHours(stats?.total_hours_tracked ?? 0)} delay={180} />
      </div>

      {/* Weekly bar chart */}
      <Card className="animate-fade-up" style={{ animationDelay: '220ms' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame size={14} className="text-warning" /> This week
            </CardTitle>
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {loading ? '—' : fmtHours(weekTotal / 3600)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          {loading ? (
            <div className="flex items-end gap-2 h-28">
              {DAY_LABELS.map(l => (
                <div key={l} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-md bg-muted/40 animate-pulse" style={{ height: `${Math.random() * 70 + 20}%` }} />
                  <span className="text-[10px] text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-2 h-28">
              {weekData.map(({ day, secs, isFuture, isToday }, i) => {
                const pct = maxSecs > 0 ? (secs / maxSecs) * 100 : 0;
                const label = DAY_LABELS[i];
                return (
                  <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                      <div
                        className={[
                          'w-full rounded-md transition-all duration-300 animate-bar-grow',
                          isFuture
                            ? 'bg-muted/30'
                            : isToday
                            ? 'bg-primary shadow-[0_0_8px_rgba(124,58,237,0.4)]'
                            : 'bg-primary/40 group-hover:bg-primary/60',
                        ].join(' ')}
                        style={{ height: `${Math.max(pct, 3)}%`, animationDelay: `${i * 40}ms` }}
                        title={`${label}: ${fmtDur(secs)}`}
                      />
                    </div>
                    <span className={`text-[10px] ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sessions */}
      <Card className="animate-fade-up" style={{ animationDelay: '280ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 px-5 pb-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-5 pb-8 pt-4 text-center">
              <Clock size={32} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Start tracking time from the desktop app.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.slice(0, 8).map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0 mr-4">
                    <p className="text-sm font-medium truncate">{s.task_name || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.started_at).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.keystroke_count > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Keyboard size={11} />{s.keystroke_count.toLocaleString()}
                      </span>
                    )}
                    {s.mouse_click_count > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MousePointerClick size={11} />{s.mouse_click_count.toLocaleString()}
                      </span>
                    )}
                    {s.productivity_score > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Progress value={s.productivity_score} className="w-12 h-1" />
                        <span className={`text-xs font-semibold tabular-nums ${scoreColor(s.productivity_score)}`}>
                          {s.productivity_score}%
                        </span>
                      </div>
                    )}
                    <Badge variant="secondary" className="tabular-nums text-xs">
                      {fmtDur(s.duration_seconds)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
