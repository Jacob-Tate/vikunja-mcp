import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vikunjaClient } from '../../vikunja/client';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function fail(error: unknown): { content: [{ type: 'text'; text: string }]; isError: true } {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[filter tool error]', msg);
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}

export function registerFilterTools(server: McpServer): void {
  server.registerTool('get-filter', {
    description: 'Get a saved filter by ID. Saved filters appear as virtual projects in Vikunja.',
    inputSchema: {
      id: z.number().int().describe('Filter ID'),
    },
  }, async ({ id }) => {
    try {
      return ok(await vikunjaClient.getFilter(id));
    } catch (e) { return fail(e); }
  });

  server.registerTool('create-filter', {
    description: 'Create a saved filter. Saved filters appear as virtual projects showing matching tasks.',
    inputSchema: {
      title: z.string().describe('Filter title'),
      description: z.string().optional().describe('Filter description'),
      is_favorite: z.boolean().optional().describe('Mark as favorite'),
      filters: z.record(z.unknown()).optional().describe('Filter configuration object (see Vikunja filter docs)'),
    },
  }, async (params) => {
    try {
      return ok(await vikunjaClient.createFilter(params));
    } catch (e) { return fail(e); }
  });

  server.registerTool('update-filter', {
    description: 'Update a saved filter.',
    inputSchema: {
      id: z.number().int().describe('Filter ID'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      is_favorite: z.boolean().optional().describe('Favorite status'),
      filters: z.record(z.unknown()).optional().describe('New filter configuration object'),
    },
  }, async ({ id, ...fields }) => {
    try {
      return ok(await vikunjaClient.updateFilter(id, fields));
    } catch (e) { return fail(e); }
  });

  server.registerTool('delete-filter', {
    description: 'Permanently delete a saved filter.',
    inputSchema: {
      id: z.number().int().describe('Filter ID to delete'),
    },
  }, async ({ id }) => {
    try {
      await vikunjaClient.deleteFilter(id);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });
}
