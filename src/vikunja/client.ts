import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';

// ── Domain Types ──────────────────────────────────────────────────────────────

export interface VikunjaUser {
  id: number;
  username: string;
  name?: string;
  email?: string;
  created?: string;
  updated?: string;
}

export interface VikunjaLabel {
  id: number;
  title: string;
  description?: string;
  hex_color?: string;
  created?: string;
  updated?: string;
  created_by?: VikunjaUser;
}

export interface VikunjaTask {
  id: number;
  title: string;
  description?: string;
  done: boolean;
  done_at?: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  priority?: number;
  hex_color?: string;
  percent_done?: number;
  project_id: number;
  bucket_id?: number;
  repeat_after?: number;
  repeat_mode?: number;
  is_favorite?: boolean;
  position?: number;
  labels?: VikunjaLabel[];
  assignees?: VikunjaUser[];
  created?: string;
  updated?: string;
  created_by?: VikunjaUser;
}

export interface VikunjaProject {
  id: number;
  title: string;
  description?: string;
  hex_color?: string;
  parent_project_id?: number;
  is_archived?: boolean;
  is_favorite?: boolean;
  position?: number;
  created?: string;
  updated?: string;
  owner?: VikunjaUser;
}

export interface VikunjaComment {
  id: number;
  comment: string;
  author?: VikunjaUser;
  created?: string;
  updated?: string;
}

export interface VikunjaTeamMember {
  id: number;
  username: string;
  name?: string;
  admin?: boolean;
}

export interface VikunjaTeam {
  id: number;
  name: string;
  description?: string;
  is_public?: boolean;
  members?: VikunjaTeamMember[];
  created?: string;
  updated?: string;
}

export interface VikunjaSavedFilter {
  id: number;
  title: string;
  description?: string;
  filters?: Record<string, unknown>;
  is_favorite?: boolean;
  created?: string;
  updated?: string;
}

export interface VikunjaView {
  id: number;
  title: string;
  project_id: number;
  view_kind: string;
  filter?: Record<string, unknown>;
  position?: number;
  created?: string;
  updated?: string;
}

export interface BulkUpdatePayload {
  task_ids: number[];
  values: Partial<VikunjaTask>;
  fields: string[];
}

export interface TaskListParams {
  page?: number;
  per_page?: number;
  s?: string;
  sort_by?: string | string[];
  order_by?: string | string[];
  filter?: string;
  filter_timezone?: string;
  filter_include_nulls?: boolean;
}

// ── Error Helper ──────────────────────────────────────────────────────────────

function vikunjaError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    const ae = err as AxiosError<{ message?: string; code?: number }>;
    const msg = ae.response?.data?.message ?? ae.message;
    const status = ae.response?.status;
    return new Error(`Vikunja API error ${status ?? ''}: ${msg}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

// ── Client ────────────────────────────────────────────────────────────────────

class VikunjaClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: `${config.vikunjaApiUrl}/api/v1`,
      headers: {
        'Authorization': `Bearer ${config.vikunjaApiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
    });
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  async getTasks(params?: TaskListParams): Promise<VikunjaTask[]> {
    try {
      const { data } = await this.http.get<VikunjaTask[]>('/tasks/all', { params });
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async getTask(id: number): Promise<VikunjaTask> {
    try {
      const { data } = await this.http.get<VikunjaTask>(`/tasks/${id}`);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async createTask(projectId: number, task: Partial<VikunjaTask>): Promise<VikunjaTask> {
    try {
      const { data } = await this.http.put<VikunjaTask>(`/projects/${projectId}/tasks`, task);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async updateTask(id: number, fields: Partial<VikunjaTask>): Promise<VikunjaTask> {
    try {
      const { data } = await this.http.post<VikunjaTask>(`/tasks/${id}`, fields);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      await this.http.delete(`/tasks/${id}`);
    } catch (e) { throw vikunjaError(e); }
  }

  async bulkUpdateTasks(payload: BulkUpdatePayload): Promise<VikunjaTask[]> {
    try {
      const { data } = await this.http.post<VikunjaTask[]>('/tasks/bulk', payload);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async getTaskAssignees(taskId: number): Promise<VikunjaUser[]> {
    try {
      const { data } = await this.http.get<VikunjaUser[]>(`/tasks/${taskId}/assignees`);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async setTaskAssignees(taskId: number, assignees: { id: number }[]): Promise<void> {
    try {
      await this.http.post(`/tasks/${taskId}/assignees/bulk`, { assignees });
    } catch (e) { throw vikunjaError(e); }
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async getComments(taskId: number): Promise<VikunjaComment[]> {
    try {
      const { data } = await this.http.get<VikunjaComment[]>(`/tasks/${taskId}/comments`);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async createComment(taskId: number, comment: string): Promise<VikunjaComment> {
    try {
      const { data } = await this.http.put<VikunjaComment>(`/tasks/${taskId}/comments`, { comment });
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async updateComment(taskId: number, commentId: number, comment: string): Promise<VikunjaComment> {
    try {
      const { data } = await this.http.post<VikunjaComment>(
        `/tasks/${taskId}/comments/${commentId}`,
        { comment },
      );
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async deleteComment(taskId: number, commentId: number): Promise<void> {
    try {
      await this.http.delete(`/tasks/${taskId}/comments/${commentId}`);
    } catch (e) { throw vikunjaError(e); }
  }

  // ── Labels ─────────────────────────────────────────────────────────────────

  async getLabels(params?: { page?: number; per_page?: number; s?: string }): Promise<VikunjaLabel[]> {
    try {
      const { data } = await this.http.get<VikunjaLabel[]>('/labels', { params });
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async createLabel(label: { title: string; description?: string; hex_color?: string }): Promise<VikunjaLabel> {
    try {
      const { data } = await this.http.put<VikunjaLabel>('/labels', label);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async updateLabel(id: number, fields: Partial<VikunjaLabel>): Promise<VikunjaLabel> {
    try {
      const { data } = await this.http.put<VikunjaLabel>(`/labels/${id}`, fields);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async deleteLabel(id: number): Promise<void> {
    try {
      await this.http.delete(`/labels/${id}`);
    } catch (e) { throw vikunjaError(e); }
  }

  async addLabelToTask(taskId: number, labelId: number): Promise<void> {
    try {
      await this.http.put(`/tasks/${taskId}/labels`, { label_id: labelId });
    } catch (e) { throw vikunjaError(e); }
  }

  async removeLabelFromTask(taskId: number, labelId: number): Promise<void> {
    try {
      await this.http.delete(`/tasks/${taskId}/labels/${labelId}`);
    } catch (e) { throw vikunjaError(e); }
  }

  // ── Projects ───────────────────────────────────────────────────────────────

  async getProjects(params?: { page?: number; per_page?: number; is_archived?: boolean }): Promise<VikunjaProject[]> {
    try {
      const { data } = await this.http.get<VikunjaProject[]>('/projects', { params });
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async getProject(id: number): Promise<VikunjaProject> {
    try {
      const { data } = await this.http.get<VikunjaProject>(`/projects/${id}`);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async createProject(project: Partial<VikunjaProject>): Promise<VikunjaProject> {
    try {
      const { data } = await this.http.put<VikunjaProject>('/projects', project);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async updateProject(id: number, fields: Partial<VikunjaProject>): Promise<VikunjaProject> {
    try {
      const { data } = await this.http.post<VikunjaProject>(`/projects/${id}`, fields);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async deleteProject(id: number): Promise<void> {
    try {
      await this.http.delete(`/projects/${id}`);
    } catch (e) { throw vikunjaError(e); }
  }

  async duplicateProject(projectId: number): Promise<VikunjaProject> {
    try {
      const { data } = await this.http.put<VikunjaProject>(`/projects/${projectId}/duplicate`);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  // ── Teams ──────────────────────────────────────────────────────────────────

  async getTeams(params?: { page?: number; per_page?: number; s?: string }): Promise<VikunjaTeam[]> {
    try {
      const { data } = await this.http.get<VikunjaTeam[]>('/teams', { params });
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async getTeam(id: number): Promise<VikunjaTeam> {
    try {
      const { data } = await this.http.get<VikunjaTeam>(`/teams/${id}`);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async createTeam(team: { name: string; description?: string; is_public?: boolean }): Promise<VikunjaTeam> {
    try {
      const { data } = await this.http.put<VikunjaTeam>('/teams', team);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async updateTeam(id: number, fields: Partial<VikunjaTeam>): Promise<VikunjaTeam> {
    try {
      const { data } = await this.http.post<VikunjaTeam>(`/teams/${id}`, fields);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async deleteTeam(id: number): Promise<void> {
    try {
      await this.http.delete(`/teams/${id}`);
    } catch (e) { throw vikunjaError(e); }
  }

  async addTeamMember(teamId: number, username: string, admin = false): Promise<void> {
    try {
      await this.http.put(`/teams/${teamId}/members`, { username, admin });
    } catch (e) { throw vikunjaError(e); }
  }

  async removeTeamMember(teamId: number, username: string): Promise<void> {
    try {
      await this.http.delete(`/teams/${teamId}/members/${username}`);
    } catch (e) { throw vikunjaError(e); }
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async getCurrentUser(): Promise<VikunjaUser> {
    try {
      const { data } = await this.http.get<VikunjaUser>('/user');
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async getUsers(s?: string): Promise<VikunjaUser[]> {
    try {
      const { data } = await this.http.get<VikunjaUser[]>('/users', { params: s ? { s } : undefined });
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  // ── Views ──────────────────────────────────────────────────────────────────

  async getViews(projectId: number): Promise<VikunjaView[]> {
    try {
      const { data } = await this.http.get<VikunjaView[]>(`/projects/${projectId}/views`);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async createView(projectId: number, view: Partial<VikunjaView>): Promise<VikunjaView> {
    try {
      const { data } = await this.http.put<VikunjaView>(`/projects/${projectId}/views`, view);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async updateView(projectId: number, viewId: number, fields: Partial<VikunjaView>): Promise<VikunjaView> {
    try {
      const { data } = await this.http.post<VikunjaView>(`/projects/${projectId}/views/${viewId}`, fields);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async deleteView(projectId: number, viewId: number): Promise<void> {
    try {
      await this.http.delete(`/projects/${projectId}/views/${viewId}`);
    } catch (e) { throw vikunjaError(e); }
  }

  // ── Saved Filters ──────────────────────────────────────────────────────────

  async getFilter(id: number): Promise<VikunjaSavedFilter> {
    try {
      const { data } = await this.http.get<VikunjaSavedFilter>(`/filters/${id}`);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async createFilter(filter: Partial<VikunjaSavedFilter>): Promise<VikunjaSavedFilter> {
    try {
      const { data } = await this.http.put<VikunjaSavedFilter>('/filters', filter);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async updateFilter(id: number, fields: Partial<VikunjaSavedFilter>): Promise<VikunjaSavedFilter> {
    try {
      const { data } = await this.http.post<VikunjaSavedFilter>(`/filters/${id}`, fields);
      return data;
    } catch (e) { throw vikunjaError(e); }
  }

  async deleteFilter(id: number): Promise<void> {
    try {
      await this.http.delete(`/filters/${id}`);
    } catch (e) { throw vikunjaError(e); }
  }
}

export const vikunjaClient = new VikunjaClient();
