'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Clock, Keyboard, MousePointerClick, Filter, TrendingUp, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getWorkspaceId, listSessions, type Session } from '@/lib/api';

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

function getCutoff(range: string): Date {
  const cutoff = new Date();
  if (range === '7d')  cutoff.setDate(cutoff.getDate() - 7);
  else if (range === '30d') cutoff.setDate(cutoff.getDate() - 30);
  else if (range === '90d') cutoff.setDate(cutoff.getDate() - 90);
  else cutoff.setFullYear(2000);
  return cutoff;
}

// Aggregate sessions by day for the chart
function buildDailyChart(sessions: Session[], range: string) {
  const days: { label: string; dateStr: string; secs: number }[] = [];

  if (range === '7d' || range === '30d') {
    const n = range === '7d' ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toDateString();
      const secs = sessions
        .filter(s => new Date(s.started_at).toDateString() === dateStr)
        .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
      days.push({
        label: range === '7d'
          ? d.toLocaleDateString(undefined, { weekday: 'short' })
          : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        dateStr,
        secs,
      });
    }
  } else {
    // Group by month for 90d / all
    const buckets = new Map<string, number>();
    sessions.forEach(s => {
      const d = new Date(s.started_at);
      const key = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      buckets.set(key, (buckets.get(key) ?? 0) + (s.duration_seconds ?? 0));
    });
    buckets.forEach((secs, label) => days.push({ label, dateStr: label, secs }));
    days.reverse();
  }

  return days;
}

export default function ReportsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState('7d');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const wsId = await getWorkspaceId();
        const data = await listSessions(wsId, { size: '100' });
        setSessions(data.items ?? []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const cutoff   = getCutoff(range);
  const filtered = sessions.filter(s => new Date(s.started_at) >= cutoff);
  const totalSecs = filtered.reduce((sum, s) => sum + (s.duration_seconds  ?? 0), 0);
  const totalKeys = filtered.reduce((sum, s) => sum + (s.keystroke_count   ?? 0), 0);
  const totalClicks=filtered.reduce((sum, s) => sum + (s.mouse_click_count ?? 0), 0);
  const avgScore  = filtered.length
    ? Math.round(filtered.reduce((sum, s) => sum + (s.productivity_score ?? 0), 0) / filtered.length)
    : 0;

  const chartDays = buildDailyChart(filtered, range);
  const maxSecs   = Math.max(...chartDays.map(d => d.secs), 1);

  const STATS = [
    { icon: Clock,             label: 'Total time',  value: fmtDur(totalSecs) },
    { icon: BarChart3,         label: 'Avg score',   value: `${avgScore}%` },
    { icon: Keyboard,          label: 'Keystrokes',  value: totalKeys.toLocaleString() },
    { icon: MousePointerClick, label: 'Clicks',      value: totalClicks.toLocaleString() },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <Select value={range} onValueChange={v => v && setRange(v)}>
            <SelectTrigger className="w-34 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 stagger">
        {STATS.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="animate-fade-up">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums animate-count-up">
                {loading ? '—' : value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CalendarDays size={14} /> Time per day
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          {loading ? (
            <div className="flex items-end gap-1 h-32">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 bg-muted/40 rounded-md animate-pulse" style={{ height: `${30 + Math.random() * 60}%` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data for this range.</p>
          ) : (
            <div className="flex items-end gap-1 h-32 overflow-x-auto">
              {chartDays.map((d, i) => {
                const pct = (d.secs / maxSecs) * 100;
                const isToday = d.dateStr === new Date().toDateString();
                return (
                  <div
                    key={d.dateStr}
                    className="flex-1 min-w-[18px] flex flex-col items-center gap-1 group"
                    title={`${d.label}: ${fmtDur(d.secs)}`}
                  >
                    <div className="w-full flex items-end" style={{ height: '88%' }}>
                      <div
                        className={[
                          'w-full rounded-sm transition-all duration-300 animate-bar-grow',
                          isToday
                            ? 'bg-primary shadow-[0_0_8px_rgba(124,58,237,0.35)]'
                            : d.secs > 0
                            ? 'bg-primary/50 group-hover:bg-primary/70'
                            : 'bg-muted/30',
                        ].join(' ')}
                        style={{ height: `${Math.max(pct, 3)}%`, animationDelay: `${i * 20}ms` }}
                      />
                    </div>
                    {chartDays.length <= 14 && (
                      <span className={`text-[9px] ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {d.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session log */}
      <Card className="animate-fade-up" style={{ animationDelay: '160ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp size={14} /> Session log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 px-5 pb-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">No sessions in this range.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(s => (
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
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Keyboard size={11} /> {(s.keystroke_count ?? 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MousePointerClick size={11} /> {(s.mouse_click_count ?? 0).toLocaleString()}
                    </span>
                    {s.productivity_score > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Progress value={s.productivity_score} className="w-10 h-1" />
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
