import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vikunjaClient } from '../../vikunja/client';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function fail(error: unknown): { content: [{ type: 'text'; text: string }]; isError: true } {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[task tool error]', msg);
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}

export function registerTaskTools(server: McpServer): void {
  server.registerTool('get-tasks', {
    description: 'Get tasks. Optionally filter by search term, sort, or use a Vikunja filter expression. Returns tasks across all projects.',
    inputSchema: {
      project_id: z.number().int().optional().describe('Filter tasks to a specific project ID'),
      s: z.string().optional().describe('Search text to filter tasks by title'),
      page: z.number().int().optional().describe('Page number (default 1)'),
      per_page: z.number().int().optional().describe('Items per page (default 50, max 50)'),
      sort_by: z.string().optional().describe('Field to sort by (e.g. due_date, priority, title, created)'),
      order_by: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
      filter: z.string().optional().describe('Vikunja filter expression (e.g. "done = false && priority >= 3")'),
    },
  }, async (params) => {
    try {
      return ok(await vikunjaClient.getTasks(params));
    } catch (e) { return fail(e); }
  });

  server.registerTool('get-task', {
    description: 'Get a single task by ID, including labels, assignees, and metadata.',
    inputSchema: {
      id: z.number().int().describe('Task ID'),
    },
  }, async ({ id }) => {
    try {
      return ok(await vikunjaClient.getTask(id));
    } catch (e) { return fail(e); }
  });

  server.registerTool('create-task', {
    description: 'Create a new task in a project.',
    inputSchema: {
      project_id: z.number().int().describe('ID of the project to create the task in'),
      title: z.string().describe('Task title'),
      description: z.string().optional().describe('Task description (supports Markdown)'),
      due_date: z.string().optional().describe('Due date in RFC 3339 format (e.g. 2026-04-01T00:00:00Z)'),
      start_date: z.string().optional().describe('Start date in RFC 3339 format'),
      priority: z.number().int().min(0).max(5).optional().describe('Priority: 0=none, 1=low, 2=medium, 3=high, 4=urgent, 5=critical'),
      hex_color: z.string().optional().describe('Color hex code without # prefix (e.g. ff0000)'),
      percent_done: z.number().min(0).max(1).optional().describe('Completion fraction 0.0–1.0'),
      is_favorite: z.boolean().optional().describe('Mark as favorite'),
    },
  }, async ({ project_id, ...task }) => {
    try {
      return ok(await vikunjaClient.createTask(project_id, task));
    } catch (e) { return fail(e); }
  });

  server.registerTool('update-task', {
    description: 'Update one or more fields of an existing task.',
    inputSchema: {
      id: z.number().int().describe('Task ID'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description (Markdown)'),
      done: z.boolean().optional().describe('Mark as done (true) or undone (false)'),
      due_date: z.string().optional().describe('New due date in RFC 3339 format'),
      start_date: z.string().optional().describe('New start date in RFC 3339 format'),
      end_date: z.string().optional().describe('New end date in RFC 3339 format'),
      priority: z.number().int().min(0).max(5).optional().describe('Priority 0–5'),
      hex_color: z.string().optional().describe('Color hex code without # prefix'),
      percent_done: z.number().min(0).max(1).optional().describe('Completion fraction 0.0–1.0'),
      is_favorite: z.boolean().optional().describe('Favorite status'),
      repeat_after: z.number().int().optional().describe('Repeat interval in seconds'),
    },
  }, async ({ id, ...fields }) => {
    try {
      return ok(await vikunjaClient.updateTask(id, fields));
    } catch (e) { return fail(e); }
  });

  server.registerTool('delete-task', {
    description: 'Permanently delete a task. This cannot be undone.',
    inputSchema: {
      id: z.number().int().describe('Task ID to delete'),
    },
  }, async ({ id }) => {
    try {
      await vikunjaClient.deleteTask(id);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });

  server.registerTool('mark-task-done', {
    description: 'Mark a task as done.',
    inputSchema: {
      id: z.number().int().describe('Task ID'),
    },
  }, async ({ id }) => {
    try {
      return ok(await vikunjaClient.updateTask(id, { done: true }));
    } catch (e) { return fail(e); }
  });

  server.registerTool('bulk-update-tasks', {
    description: 'Update the same fields on multiple tasks at once.',
    inputSchema: {
      task_ids: z.array(z.number().int()).describe('Array of task IDs to update'),
      fields: z.array(z.string()).describe('Field names to update (e.g. ["done", "priority"])'),
      values: z.object({
        done: z.boolean().optional(),
        priority: z.number().int().min(0).max(5).optional(),
        due_date: z.string().optional(),
        project_id: z.number().int().optional().describe('Move tasks to this project'),
        hex_color: z.string().optional(),
        percent_done: z.number().min(0).max(1).optional(),
      }).describe('Values to apply to all specified tasks'),
    },
  }, async ({ task_ids, fields, values }) => {
    try {
      return ok(await vikunjaClient.bulkUpdateTasks({ task_ids, fields, values }));
    } catch (e) { return fail(e); }
  });

  server.registerTool('get-task-assignees', {
    description: 'Get all users assigned to a task.',
    inputSchema: {
      task_id: z.number().int().describe('Task ID'),
    },
  }, async ({ task_id }) => {
    try {
      return ok(await vikunjaClient.getTaskAssignees(task_id));
    } catch (e) { return fail(e); }
  });

  server.registerTool('set-task-assignees', {
    description: 'Bulk-set assignees on a task. Replaces all existing assignees.',
    inputSchema: {
      task_id: z.number().int().describe('Task ID'),
      assignee_ids: z.array(z.number().int()).describe('User IDs to assign (empty array removes all assignees)'),
    },
  }, async ({ task_id, assignee_ids }) => {
    try {
      await vikunjaClient.setTaskAssignees(task_id, assignee_ids.map(id => ({ id })));
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });
}
