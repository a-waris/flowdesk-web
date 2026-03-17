'use client';

import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Trash2, FolderOpen, Pencil, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getWorkspaceId, listProjects, createProject, updateProject, deleteProject, type Project } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-success/15 text-success border-success/20',
  paused:    'bg-warning/15 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-border',
  archived:  'bg-muted/50 text-muted-foreground border-border',
};

const PRESET_COLORS = [
  '#7c3aed', '#6366f1', '#2563eb', '#0891b2',
  '#059669', '#14b8a6', '#d97706', '#dc2626',
  '#db2777', '#ec4899', '#8b5cf6', '#a855f7',
];

interface ProjectForm {
  name: string;
  description: string;
  color: string;
  status: Project['status'];
}

const DEFAULT_FORM: ProjectForm = { name: '', description: '', color: '#7c3aed', status: 'active' };

export default function ProjectsPage() {
  const [wsId, setWsId]           = useState<string | null>(null);
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm]             = useState<ProjectForm>(DEFAULT_FORM);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  async function load(id: string) {
    const data = await listProjects(id);
    setProjects(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    getWorkspaceId().then(id => { setWsId(id); load(id); }).catch(() => setLoading(false));
  }, []);

  function openCreate() {
    setForm(DEFAULT_FORM);
    setError('');
    setCreateOpen(true);
  }

  function openEdit(p: Project) {
    setForm({ name: p.name, description: p.description ?? '', color: p.color ?? '#7c3aed', status: p.status });
    setError('');
    setEditProject(p);
  }

  function closeDialogs() {
    setCreateOpen(false);
    setEditProject(null);
  }

  async function handleSubmit() {
    if (!wsId || !form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (editProject) {
        await updateProject(editProject.id, wsId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          color: form.color,
          status: form.status,
        });
      } else {
        await createProject(wsId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          color: form.color,
          status: 'active',
          workspace_id: wsId,
        });
      }
      closeDialogs();
      load(wsId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(projectId: string) {
    if (!wsId) return;
    await deleteProject(projectId, wsId).catch(() => {});
    load(wsId);
  }

  const active = projects.filter(p => p.status === 'active');

  const isOpen = createOpen || !!editProject;
  const isEdit = !!editProject;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">{active.length} active · {projects.length} total</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
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
              {[0, 1, 2].map(i => (
                <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="px-5 pb-10 pt-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                <FolderOpen size={22} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create your first project to start tracking time.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: (p.color || '#7c3aed') + '22' }}
                    >
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color || '#7c3aed' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold capitalize hidden sm:flex ${STATUS_COLORS[p.status] ?? STATUS_COLORS.active}`}
                    >
                      {p.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="animate-scale-in">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil size={13} className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p.id)}>
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

      {/* Create / Edit dialog */}
      <Dialog open={isOpen} onOpenChange={open => !open && closeDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="proj_name">Project name</Label>
              <Input
                id="proj_name"
                placeholder="e.g. Website Redesign"
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj_desc">Description (optional)</Label>
              <Input
                id="proj_desc"
                placeholder="What's this project about?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {isEdit && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Project['status'] }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PRESET_COLORS.slice(0, 10).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="h-6 w-6 rounded-full transition-transform hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {form.color === c && <Check size={12} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>
              {saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create project')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
