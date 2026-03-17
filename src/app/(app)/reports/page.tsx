'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Clock, Keyboard, MousePointerClick, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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

export default function ReportsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const wsId = await getWorkspaceId();
        const data = await listSessions(wsId, { size: '100' });
        setSessions(data.items ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cutoff = new Date();
  if (range === '7d') cutoff.setDate(cutoff.getDate() - 7);
  else if (range === '30d') cutoff.setDate(cutoff.getDate() - 30);
  else if (range === '90d') cutoff.setDate(cutoff.getDate() - 90);
  else cutoff.setFullYear(2000);

  const filtered = sessions.filter(s => new Date(s.started_at) >= cutoff);
  const totalSecs = filtered.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const totalKeys = filtered.reduce((sum, s) => sum + (s.keystroke_count ?? 0), 0);
  const totalClicks = filtered.reduce((sum, s) => sum + (s.mouse_click_count ?? 0), 0);
  const avgScore = filtered.length
    ? Math.round(filtered.reduce((sum, s) => sum + (s.productivity_score ?? 0), 0) / filtered.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <Select value={range} onValueChange={(v) => v && setRange(v)}>
            <SelectTrigger className="w-32 h-8 text-xs">
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: Clock, label: 'Total time', value: fmtDur(totalSecs) },
          { icon: BarChart3, label: 'Avg score', value: `${avgScore}%` },
          { icon: Keyboard, label: 'Keystrokes', value: totalKeys.toLocaleString() },
          { icon: MousePointerClick, label: 'Clicks', value: totalClicks.toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums">{loading ? '—' : value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Session log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Session log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 px-5 pb-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">No sessions in this range.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{s.task_name || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.started_at).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Keyboard size={11} /> {s.keystroke_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MousePointerClick size={11} /> {s.mouse_click_count ?? 0}
                    </span>
                    {s.productivity_score > 0 && (
                      <span className={`text-xs font-semibold tabular-nums ${scoreColor(s.productivity_score)}`}>
                        {s.productivity_score}%
                      </span>
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
