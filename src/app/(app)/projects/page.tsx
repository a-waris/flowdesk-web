'use client';

import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Trash2, FolderOpen, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getWorkspaceId, listProjects, createProject, deleteProject, type Project } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-success/15 text-success border-success/20',
  paused:    'bg-warning/15 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-border',
  archived:  'bg-muted text-muted-foreground border-border',
};

export default function ProjectsPage() {
  const [wsId, setWsId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function load(id: string) {
    const data = await listProjects(id);
    setProjects(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    getWorkspaceId().then(id => { setWsId(id); load(id); }).catch(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!wsId || !newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createProject(wsId, {
        name: newName.trim(),
        status: 'active',
        workspace_id: wsId,
      });
      setNewName('');
      setCreateOpen(false);
      load(wsId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(projectId: string) {
    if (!wsId) return;
    await deleteProject(projectId, wsId).catch(() => {});
    load(wsId);
  }

  const active = projects.filter(p => p.status === 'active');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">{active.length} active · {projects.length} total</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={15} /> New project
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FolderOpen size={14} /> All projects
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 px-5 pb-5">
              {[0, 1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="px-5 pb-8 pt-4 text-center">
              <FolderOpen size={32} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No projects yet. Create your first one.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: (p.color || '#7c3aed') + '22' }}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: p.color || '#7c3aed' }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold capitalize ${STATUS_COLORS[p.status] ?? STATUS_COLORS.active}`}
                    >
                      {p.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                      <Users size={13} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent transition-colors">
                        <MoreHorizontal size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 size={13} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Project name"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
