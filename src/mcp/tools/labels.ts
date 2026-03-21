import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vikunjaClient } from '../../vikunja/client';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function fail(error: unknown): { content: [{ type: 'text'; text: string }]; isError: true } {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[label tool error]', msg);
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}

export function registerLabelTools(server: McpServer): void {
  server.registerTool('get-labels', {
    description: 'Get all labels available to the current user.',
    inputSchema: {
      page: z.number().int().optional().describe('Page number'),
      per_page: z.number().int().optional().describe('Items per page'),
      s: z.string().optional().describe('Search text'),
    },
  }, async (params) => {
    try {
      return ok(await vikunjaClient.getLabels(params));
    } catch (e) { return fail(e); }
  });

  server.registerTool('create-label', {
    description: 'Create a new label.',
    inputSchema: {
      title: z.string().describe('Label title'),
      description: z.string().optional().describe('Label description'),
      hex_color: z.string().optional().describe('Color hex code without # prefix (e.g. ff0000)'),
    },
  }, async (params) => {
    try {
      return ok(await vikunjaClient.createLabel(params));
    } catch (e) { return fail(e); }
  });

  server.registerTool('update-label', {
    description: 'Update a label\'s title, description, or color.',
    inputSchema: {
      id: z.number().int().describe('Label ID'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      hex_color: z.string().optional().describe('New color hex code without # prefix'),
    },
  }, async ({ id, ...fields }) => {
    try {
      return ok(await vikunjaClient.updateLabel(id, fields));
    } catch (e) { return fail(e); }
  });

  server.registerTool('delete-label', {
    description: 'Permanently delete a label.',
    inputSchema: {
      id: z.number().int().describe('Label ID to delete'),
    },
  }, async ({ id }) => {
    try {
      await vikunjaClient.deleteLabel(id);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });

  server.registerTool('add-label-to-task', {
    description: 'Add a label to a task.',
    inputSchema: {
      task_id: z.number().int().describe('Task ID'),
      label_id: z.number().int().describe('Label ID to add'),
    },
  }, async ({ task_id, label_id }) => {
    try {
      await vikunjaClient.addLabelToTask(task_id, label_id);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });

  server.registerTool('remove-label-from-task', {
    description: 'Remove a label from a task.',
    inputSchema: {
      task_id: z.number().int().describe('Task ID'),
      label_id: z.number().int().describe('Label ID to remove'),
    },
  }, async ({ task_id, label_id }) => {
    try {
      await vikunjaClient.removeLabelFromTask(task_id, label_id);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });
}
