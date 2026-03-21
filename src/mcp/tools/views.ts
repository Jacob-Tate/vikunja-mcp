import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vikunjaClient } from '../../vikunja/client';
import { ok, fail } from './utils';


const VIEW_KINDS = ['list', 'gantt', 'table', 'kanban'] as const;

export function registerViewTools(server: McpServer): void {
  server.registerTool('get-views', {
    description: 'Get all views for a project (list, kanban board, gantt, table).',
    inputSchema: {
      project_id: z.number().int().describe('Project ID'),
    },
  }, async ({ project_id }) => {
    try {
      return ok(await vikunjaClient.getViews(project_id));
    } catch (e) { return fail('view tool error', e); }
  });

  server.registerTool('create-view', {
    description: 'Create a new view for a project.',
    inputSchema: {
      project_id: z.number().int().describe('Project ID'),
      title: z.string().describe('View title'),
      view_kind: z.enum(VIEW_KINDS).describe('View type: list, kanban, gantt, or table'),
    },
  }, async ({ project_id, ...view }) => {
    try {
      return ok(await vikunjaClient.createView(project_id, view));
    } catch (e) { return fail('view tool error', e); }
  });

  server.registerTool('update-view', {
    description: 'Update a project view.',
    inputSchema: {
      project_id: z.number().int().describe('Project ID'),
      view_id: z.number().int().describe('View ID'),
      title: z.string().optional().describe('New title'),
      view_kind: z.enum(VIEW_KINDS).optional().describe('New view type'),
    },
  }, async ({ project_id, view_id, ...fields }) => {
    try {
      return ok(await vikunjaClient.updateView(project_id, view_id, fields));
    } catch (e) { return fail('view tool error', e); }
  });

  server.registerTool('delete-view', {
    description: 'Delete a view from a project.',
    inputSchema: {
      project_id: z.number().int().describe('Project ID'),
      view_id: z.number().int().describe('View ID to delete'),
    },
  }, async ({ project_id, view_id }) => {
    try {
      await vikunjaClient.deleteView(project_id, view_id);
      return ok({ success: true });
    } catch (e) { return fail('view tool error', e); }
  });
}
