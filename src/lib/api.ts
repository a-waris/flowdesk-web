const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://activity-api-liard.vercel.app/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('flowdesk_token');
}

export function setToken(token: string) {
  localStorage.setItem('flowdesk_token', token);
}

export function clearToken() {
  localStorage.removeItem('flowdesk_token');
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
}

// ── Workspace ──────────────────────────────────────────────

export async function getWorkspaceId(): Promise<string> {
  const data = await apiFetch<{ items?: { id: string }[] }>('/workspaces/');
  const workspaces = data.items ?? [];
  if (workspaces.length) return workspaces[0].id;
  // Auto-create
  const created = await apiFetch<{ id: string }>('/workspaces/', {
    method: 'POST',
    body: JSON.stringify({ name: 'Personal Workspace', slug: `personal-${Date.now()}` }),
  });
  return created.id;
}

export async function getWorkspace() {
  const id = await getWorkspaceId();
  return apiFetch(`/workspaces/${id}`);
}

// ── Team ───────────────────────────────────────────────────

export async function listWorkspaceMembers(workspaceId: string) {
  return apiFetch<{ items: WorkspaceMember[] }>(`/workspaces/${workspaceId}/users`);
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  return apiFetch(`/workspaces/${workspaceId}/users/${userId}`, { method: 'DELETE' });
}

export async function listPendingInvitations(workspaceId: string) {
  return apiFetch<WorkspaceInvitation[]>(`/invitations/workspace/${workspaceId}`);
}

export async function inviteMember(workspaceId: string, email: string) {
  return apiFetch('/invitations/', {
    method: 'POST',
    body: JSON.stringify({ email, workspace_id: workspaceId }),
  });
}

export async function revokeInvitation(token: string) {
  return apiFetch(`/invitations/${token}`, { method: 'DELETE' });
}

// ── Projects ───────────────────────────────────────────────

export async function listProjects(workspaceId: string) {
  return apiFetch<{ items: Project[] }>(`/projects/?workspace_id=${workspaceId}&size=100`);
}

export async function createProject(workspaceId: string, data: Partial<Project>) {
  return apiFetch<Project>(`/projects/?workspace_id=${workspaceId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(projectId: string, workspaceId: string, data: Partial<Project>) {
  return apiFetch<Project>(`/projects/${projectId}?workspace_id=${workspaceId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(projectId: string, workspaceId: string) {
  return apiFetch(`/projects/${projectId}?workspace_id=${workspaceId}`, { method: 'DELETE' });
}

export async function listProjectMembers(projectId: string) {
  return apiFetch<{ items: ProjectMember[] }>(`/project-members/${projectId}/members`);
}

export async function addProjectMember(projectId: string, userId: string, role = 'contributor') {
  return apiFetch(`/project-members/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role }),
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  return apiFetch(`/project-members/${projectId}/members/${userId}`, { method: 'DELETE' });
}

// ── Sessions / Reports ─────────────────────────────────────

export async function listSessions(workspaceId: string, params?: Record<string, string>) {
  const qs = new URLSearchParams({ workspace_id: workspaceId, size: '50', ...params }).toString();
  return apiFetch<{ items: Session[] }>(`/sessions/?${qs}`);
}

export async function getWorkspaceStats(workspaceId: string) {
  return apiFetch<WorkspaceStats>(`/workspaces/${workspaceId}/stats`);
}

export async function getCurrentUser() {
  return apiFetch<User>('/users/me');
}

// ── Types ──────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: string;
}

export interface WorkspaceMember {
  user_id: string;
  workspace_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'guest';
  joined_at: string;
  user_email: string;
  user_username: string;
  user_full_name: string;
  user_avatar_url?: string;
  can_manage_projects: boolean;
  can_manage_users: boolean;
  can_view_reports: boolean;
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  workspace_id: string;
  inviter_id: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  workspace_id: string;
  user_id: string;
  created_at: string;
}

export interface ProjectMember {
  user_id: string;
  role: string;
  email: string;
  full_name: string;
  joined_at: string;
}

export interface Session {
  id: string;
  task_name: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  keystroke_count: number;
  mouse_click_count: number;
  productivity_score: number;
  status: string;
  project_id?: string;
}

export interface WorkspaceStats {
  total_users: number;
  total_projects: number;
  total_clients: number;
  total_time_entries: number;
  total_hours_tracked: number;
  active_projects: number;
  this_month_hours: number;
  last_month_hours: number;
}
