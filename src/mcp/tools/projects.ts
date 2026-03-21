import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vikunjaClient } from '../../vikunja/client';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function fail(error: unknown): { content: [{ type: 'text'; text: string }]; isError: true } {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[project tool error]', msg);
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}

export function registerProjectTools(server: McpServer): void {
  server.registerTool('get-projects', {
    description: 'Get all projects the current user has access to.',
    inputSchema: {
      page: z.number().int().optional().describe('Page number'),
      per_page: z.number().int().optional().describe('Items per page'),
      is_archived: z.boolean().optional().describe('Filter by archived status'),
    },
  }, async (params) => {
    try {
      return ok(await vikunjaClient.getProjects(params));
    } catch (e) { return fail(e); }
  });

  server.registerTool('get-project', {
    description: 'Get a single project by ID.',
    inputSchema: {
      id: z.number().int().describe('Project ID'),
    },
  }, async ({ id }) => {
    try {
      return ok(await vikunjaClient.getProject(id));
    } catch (e) { return fail(e); }
  });

  server.registerTool('create-project', {
    description: 'Create a new project.',
    inputSchema: {
      title: z.string().describe('Project title'),
      description: z.string().optional().describe('Project description'),
      hex_color: z.string().optional().describe('Color hex code without # prefix'),
      parent_project_id: z.number().int().optional().describe('ID of parent project (for sub-projects)'),
      is_favorite: z.boolean().optional().describe('Mark as favorite'),
    },
  }, async (params) => {
    try {
      return ok(await vikunjaClient.createProject(params));
    } catch (e) { return fail(e); }
  });

  server.registerTool('update-project', {
    description: 'Update fields of an existing project.',
    inputSchema: {
      id: z.number().int().describe('Project ID'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      hex_color: z.string().optional().describe('New color hex code without # prefix'),
      is_archived: z.boolean().optional().describe('Archive or unarchive the project'),
      is_favorite: z.boolean().optional().describe('Favorite status'),
      parent_project_id: z.number().int().optional().describe('New parent project ID'),
    },
  }, async ({ id, ...fields }) => {
    try {
      return ok(await vikunjaClient.updateProject(id, fields));
    } catch (e) { return fail(e); }
  });

  server.registerTool('delete-project', {
    description: 'Permanently delete a project and all its tasks. This cannot be undone.',
    inputSchema: {
      id: z.number().int().describe('Project ID to delete'),
    },
  }, async ({ id }) => {
    try {
      await vikunjaClient.deleteProject(id);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });

  server.registerTool('duplicate-project', {
    description: 'Duplicate a project including all its tasks.',
    inputSchema: {
      project_id: z.number().int().describe('Project ID to duplicate'),
    },
  }, async ({ project_id }) => {
    try {
      return ok(await vikunjaClient.duplicateProject(project_id));
    } catch (e) { return fail(e); }
  });
}
