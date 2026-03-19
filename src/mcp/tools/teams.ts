import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vikunjaClient } from '../../vikunja/client';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function fail(error: unknown): { content: [{ type: 'text'; text: string }]; isError: true } {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[team tool error]', msg);
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}

export function registerTeamTools(server: McpServer): void {
  server.registerTool('get-teams', {
    description: 'Get all teams the current user is a member of.',
    inputSchema: {
      page: z.number().int().optional().describe('Page number'),
      per_page: z.number().int().optional().describe('Items per page'),
      s: z.string().optional().describe('Search text'),
    },
  }, async (params) => {
    try {
      return ok(await vikunjaClient.getTeams(params));
    } catch (e) { return fail(e); }
  });

  server.registerTool('get-team', {
    description: 'Get a single team by ID including its members.',
    inputSchema: {
      id: z.number().int().describe('Team ID'),
    },
  }, async ({ id }) => {
    try {
      return ok(await vikunjaClient.getTeam(id));
    } catch (e) { return fail(e); }
  });

  server.registerTool('create-team', {
    description: 'Create a new team.',
    inputSchema: {
      name: z.string().describe('Team name'),
      description: z.string().optional().describe('Team description'),
      is_public: z.boolean().optional().describe('Make the team publicly visible'),
    },
  }, async (params) => {
    try {
      return ok(await vikunjaClient.createTeam(params));
    } catch (e) { return fail(e); }
  });

  server.registerTool('update-team', {
    description: 'Update a team\'s name, description, or visibility.',
    inputSchema: {
      id: z.number().int().describe('Team ID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      is_public: z.boolean().optional().describe('Public visibility'),
    },
  }, async ({ id, ...fields }) => {
    try {
      return ok(await vikunjaClient.updateTeam(id, fields));
    } catch (e) { return fail(e); }
  });

  server.registerTool('delete-team', {
    description: 'Permanently delete a team.',
    inputSchema: {
      id: z.number().int().describe('Team ID to delete'),
    },
  }, async ({ id }) => {
    try {
      await vikunjaClient.deleteTeam(id);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });

  server.registerTool('add-team-member', {
    description: 'Add a user to a team.',
    inputSchema: {
      team_id: z.number().int().describe('Team ID'),
      username: z.string().describe('Username of the user to add'),
      admin: z.boolean().optional().describe('Grant admin rights to this member'),
    },
  }, async ({ team_id, username, admin }) => {
    try {
      await vikunjaClient.addTeamMember(team_id, username, admin ?? false);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });

  server.registerTool('remove-team-member', {
    description: 'Remove a user from a team.',
    inputSchema: {
      team_id: z.number().int().describe('Team ID'),
      username: z.string().describe('Username of the member to remove'),
    },
  }, async ({ team_id, username }) => {
    try {
      await vikunjaClient.removeTeamMember(team_id, username);
      return ok({ success: true });
    } catch (e) { return fail(e); }
  });
}
