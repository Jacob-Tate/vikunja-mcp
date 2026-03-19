# Vikunja MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that gives Claude.ai direct access to your [Vikunja](https://vikunja.io) task management data.

## Features

- **42 tools** covering tasks, comments, labels, projects, teams, users, views, and saved filters
- **OAuth 2.0** authentication compatible with Claude.ai's MCP integration
- **Single-user** design — your Vikunja API token is configured via environment variables, never stored in MCP tokens
- **Stateless HTTP** transport with `StreamableHTTPServerTransport`

## Tools Available

| Group | Tools |
|-------|-------|
| Tasks | `get-tasks`, `get-task`, `create-task`, `update-task`, `delete-task`, `mark-task-done`, `bulk-update-tasks`, `get-task-assignees`, `set-task-assignees` |
| Comments | `get-comments`, `create-comment`, `update-comment`, `delete-comment` |
| Labels | `get-labels`, `create-label`, `update-label`, `delete-label`, `add-label-to-task`, `remove-label-from-task` |
| Projects | `get-projects`, `get-project`, `create-project`, `update-project`, `delete-project`, `duplicate-project` |
| Teams | `get-teams`, `get-team`, `create-team`, `update-team`, `delete-team`, `add-team-member`, `remove-team-member` |
| Users | `get-current-user`, `get-users` |
| Views | `get-views`, `create-view`, `update-view`, `delete-view` |
| Filters | `get-filter`, `create-filter`, `update-filter`, `delete-filter` |

## Example Prompts

Once connected, you can ask Claude things like:

**Tasks**
- "Show me all my overdue tasks"
- "Create a task called 'Review PR #42' in the Backend project, due Friday, high priority"
- "Mark all tasks in the 'Done' bucket as complete"
- "Move all tasks assigned to me with priority ≥ 3 to the top of the list"

**Projects & Organization**
- "List all my active projects"
- "Create a new project called 'Q2 Planning' with a blue color"
- "What tasks are in the Mobile project that are still open?"

**Labels & Teams**
- "Add the 'bug' label to task #123"
- "Show me all members of the Engineering team"
- "Create a label called 'blocked' in red"

**Comments & Collaboration**
- "Add a comment to task #45 saying the PR is ready for review"
- "Show me all comments on task #99"

---

## Quick Start with Docker

```bash
docker run -d \
  -p 3000:3000 \
  -v vikunja-mcp-data:/app/data \
  -e VIKUNJA_API_URL=https://your-vikunja-instance.com \
  -e VIKUNJA_API_TOKEN=your-api-token \
  -e MCP_AUTH_PASSWORD=choose-a-strong-password \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e BASE_URL=https://your-mcp-domain.com \
  ghcr.io/jacob-tate/vikunja-mcp:latest
```

Or with Docker Compose — see [docker-compose.yml](docker-compose.yml).

## Connecting to Claude.ai

1. In Claude.ai, go to **Settings → Integrations → Add MCP Server**
2. Enter your server URL: `https://your-mcp-domain.com/mcp`
3. A browser popup will open — enter your `MCP_AUTH_PASSWORD`
4. Done — Claude can now access your Vikunja data

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VIKUNJA_API_URL` | ✅ | URL of your Vikunja instance |
| `VIKUNJA_API_TOKEN` | ✅ | API token from Vikunja → Settings → API Tokens |
| `MCP_AUTH_PASSWORD` | ✅ | Password shown in the OAuth browser popup |
| `JWT_SECRET` | ✅ | Random string ≥ 32 chars for signing tokens |
| `BASE_URL` | ✅ | Public HTTPS URL of this MCP server |
| `PORT` | — | HTTP port (default: `3000`) |
| `AUTH_DB_PATH` | — | SQLite DB for OAuth tokens (default: `./data/auth.db`) |

### Generating a Vikunja API Token

In Vikunja: **Settings → API Tokens → Create Token**

Give it a descriptive name (e.g. "Claude MCP") and set an appropriate expiry. Grant it the permissions you want Claude to have.

## Running Without Docker

Requires **Node.js 22** (`better-sqlite3` won't compile on Node 24).

```bash
nvm use 22
npm install
cp .env.example .env
# edit .env with your values
npm run build
npm start
```

**Development (hot reload):**
```bash
npm run dev
```

> **Note**: Do not run `npm run typecheck` — the MCP SDK's type definitions exceed Node's heap limit.
> Use `npm run build` (esbuild, ~6ms) to verify the code compiles.

## Token Revocation

To invalidate a token immediately:

```bash
# Revoke an access token (JWT)
curl -X POST https://your-mcp-domain.com/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=<access_token>"

# Revoke a refresh token (UUID)
curl -X POST https://your-mcp-domain.com/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=<refresh_token>"
```

Always returns `200 OK` per [RFC 7009](https://datatracker.ietf.org/doc/html/rfc7009).

> **To invalidate all tokens at once:** rotate `JWT_SECRET` in `.env` and restart.

## Deployment Notes

- Expose port 3000 behind a reverse proxy (nginx, Caddy) with HTTPS
- `BASE_URL` must be the public HTTPS URL — Claude.ai requires HTTPS for OAuth
- OAuth tokens are persisted in SQLite (`./data/auth.db`) — survive restarts
- Access tokens expire after 24 hours; refresh tokens last 90 days and rotate silently

## Project Structure

```
src/
├── config.ts              # Env var validation
├── index.ts               # Express app + startup
├── auth/
│   ├── db.ts              # SQLite singleton + schema init
│   ├── store.ts           # SQLite-backed OAuth state (tokens, clients)
│   ├── oauth.ts           # OAuthServerProvider + login form
│   └── middleware.ts      # Bearer token validation
├── vikunja/
│   └── client.ts          # axios-based Vikunja API client
└── mcp/
    ├── server.ts
    └── tools/
        ├── tasks.ts
        ├── comments.ts
        ├── labels.ts
        ├── projects.ts
        ├── teams.ts
        ├── users.ts
        ├── views.ts
        └── filters.ts
```
