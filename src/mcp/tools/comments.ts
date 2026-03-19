import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vikunjaClient } from '../../vikunja/client';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function fail(error: unknown): { content: [{ type: 'text'; text: string }]; isError: true } {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[comment tool error]', msg);
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}

export function registerCommentTools(server: McpServer): void {
  server.registerTool('get-comments', {
    description: 'Get all comments on a task.',
    inputSchema: {
      task_id: z.number().int().describe('Task ID'),
    },
  }, async ({ task_id }) => {
    try {
      return ok(await vikunjaClient.getComments(task_id));
    } catch (e) { return fail(e); }
  });

  server.registerTool('create-comment', {
    description: 'Add a comment to a task.',
    inputSchema: {
      task_id: z.number().int().describe('Task ID'),
      comment: z.string().describe('Comment text (supports Markdown)'),
    },
  }, async ({ task_id, comment }) => {
    try {
      return ok(await vikunjaClient.createComment(task_id, comment));
    } catch (e) { return fail(e); }
  });

  server.registerTool('update-comment', {
    description: 'Update the text of an existing comment.',
    inputSchema: {
      task_id: z.number().int().describe('Task ID'),
      comment_id: z.number().int().describe('Comment ID'),
      comment: z.string().describe('New comment text'),
    },
  }, async ({ task_id, comment_id, comment }) => {
    try {
      return ok(await vikunjaClient.updateComment(task_id, comment_id, comment));
    } catch (e) { return fail(e); }
  });

  server.registerTool('delete-comment', {
    description: 'Delete a comment from a task.',
    inputSchema: {
      task_id: z.number().int().describe('Task ID'),
      comment_id: z.number().int().describe('Comment ID to delete'),
    },
  }, async ({ task_id, comment_id }) => {
    try {
      await vikunjaClient.deleteComment(task_id, comment_id);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });
}
