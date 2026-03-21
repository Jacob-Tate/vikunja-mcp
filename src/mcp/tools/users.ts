import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vikunjaClient } from '../../vikunja/client';
import { ok, fail } from './utils';


export function registerUserTools(server: McpServer): void {
  server.registerTool('get-current-user', {
    description: 'Get the current authenticated user\'s profile.',
  }, async () => {
    try {
      return ok(await vikunjaClient.getCurrentUser());
    } catch (e) { return fail('user tool error', e); }
  });

  server.registerTool('get-users', {
    description: 'Search for users by username. Useful for finding user IDs to use when assigning tasks or adding team members.',
    inputSchema: {
      s: z.string().optional().describe('Search query (username or name)'),
    },
  }, async ({ s }) => {
    try {
      return ok(await vikunjaClient.getUsers(s));
    } catch (e) { return fail('user tool error', e); }
  });
}
