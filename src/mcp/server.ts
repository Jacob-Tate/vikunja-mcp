import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTaskTools } from './tools/tasks';
import { registerCommentTools } from './tools/comments';
import { registerLabelTools } from './tools/labels';
import { registerProjectTools } from './tools/projects';
import { registerTeamTools } from './tools/teams';
import { registerUserTools } from './tools/users';
import { registerViewTools } from './tools/views';
import { registerFilterTools } from './tools/filters';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'vikunja',
    version: '1.0.0',
  });

  registerTaskTools(server);
  registerCommentTools(server);
  registerLabelTools(server);
  registerProjectTools(server);
  registerTeamTools(server);
  registerUserTools(server);
  registerViewTools(server);
  registerFilterTools(server);

  return server;
}
